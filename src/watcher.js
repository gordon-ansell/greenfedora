/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const path = require('path');
const chokidar = require('chokidar');
const debug = require("debug")("GreenFedora:Watcher");
const debugdev = require("debug")("Dev.GreenFedora:Watcher");

/**
 * Watcher.
 */
class Watcher
{
    /**
     * Configs.
     * @member  {Config}
     */
    config = null;

    /**
     * GreenFedora.
     * @member  {GreenFedora}
     */
    greenfedora = null;

    /**
     * Server.
     * @member {Server}
     */
    server = null;

    /**
     * File queue.
     * @member {string[]}
     */
    fileQueue = [];

    /**
     * Constructor.
     * 
     * @param   {Config}        config          Configs.
     * @param   {GreenFedora}   greenfedora     GreenFedora instance.
     * @param   {Server}        server          Server instance.
     * 
     * @return  {Server}
     */
    constructor(config, greenfedora, server)
    {
        this.config = config;
        this.greenfedora = greenfedora;
        this.server = server;
    }

    /**
     * Execute the watcher.
     * 
     * @return 
     */
    async execute()
    {
        let buildCss = false;
        let buildAll = false;
        if (this.fileQueue.length > 0) {

            let files = [];

            for (let file of this.fileQueue) {
                let rel = file.replace(this.config.sitePath, '');
                let ext = path.extname(file);

                // Control file change -> build all.
                if (-1 !== file.indexOf('.grnfdr')) {
                    buildAll = true;
                    break;

                // SCSS file change -> build all CSS files.
                } else if ('.scss' === ext || '.css' === ext) {
                    for (let cssf of this.config.getBaseConfig().mainCssFiles) {
                        files.push(cssf);
                    }
                    buildCss = true;

                // Layout or data file change -> build all dependencies.
                } else if (-1 !== file.indexOf('_layouts/') || -1 !== file.indexOf('_data/')) {
                    let relChange = file.replace(this.config.sitePath, '');
                    let depArr = this.config.layoutDependencies.dependantsOf(relChange);
                    for (let item of depArr) {
                        files.push(item);
                    }
                
                // Standard -> just build the changed file.
                } else {
                    files.push(rel);
                }
            }

            // Reset the file queue.
            this.fileQueue = [];

            if (buildAll) {
                syslog.notice(`Data or control file changed, will rebuild everything.`)
                this.greenfedora.loadConfig();
                this.greenfedora.cleanDirs();
                await this.greenfedora.init();
                await this.greenfedora.render();
            } else if (files.length > 0) {
                await this.greenfedora.processWatch(files, buildCss);
            }
        }
    }

    /**
     * Do the watch.
     * 
     * @return  {void}
     */
    async watch()
    {
        let bc = this.config.getBaseConfig();
        let ignores = bc.fsParserWatcher.options.ignore;

        for (let idx in ignores) {
            ignores[idx] = path.join(this.config.sitePath, ignores[idx]);
        }

        const ch = chokidar.watch(this.config.sitePath, {
            ignored: ignores,
            ignoreInitial: true
        });

        syslog.notice(`Starting watcher ...`);

        let watchDelay;
        let watchExecute = async (filePath) => {
            try {
                this.fileQueue.push(filePath);
                clearTimeout(watchDelay);

                await new Promise((resolve, reject) => {
                    watchDelay = setTimeout(async () => {
                        this.execute().then(resolve, reject);
                    }, 0);
                });
            } catch (e) {
                syslog.error(`Watcher error: ${e.message}`);
            }
        }

        ch.on('change', async (filePath) => {
            syslog.notice(`File changed: ${filePath.replace(this.config.sitePath, '')}`);
            await watchExecute(filePath);
        });

        ch.on('add', async (filePath) => {
            syslog.notice(`File added: ${filePath.replace(this.config.sitePath, '')}`);
            await watchExecute(filePath);
        });

        ch.on('unlink', async (filePath) => {
            syslog.notice(`File deleted: ${filePath.replace(this.config.sitePath, '')}`);
            await watchExecute(filePath);
        });

        process.on('SIGINT', () => {
            this.server.stop();
            ch.close();
            process.exit(0);
        });

    }

}

module.exports = Watcher;