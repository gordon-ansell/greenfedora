/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const gfpkg = require("../package.json");
const { syslog, GfError, Benchmarks, FsUtils, Merge, GfString } = require('greenfedora-utils');
const path = require('path');
const fs = require('fs');
const Config = require("./config");
const TemplateFile = require('./template/file/templateFile');
const GlobalDataFileConfig = require('./config/globalDataFileConfig');
const Collection = require('./collection');
const FsParser = require('./fsParser');
const Server = require('./server');
const beautify = require('js-beautify').html;
const Watcher = require('./watcher');
const constants = require('./config/constants');
const Pagination = require("./template/pagination");
const debug = require("debug")("GreenFedora");
const debugdev = require("debug")("Dev.GreenFedora");

/**
 * Central processing class.
 */
class GreenFedora
{
    /**
     * Process arguments.
     * @member  {ProcessArgs}
     */
    processArgs = undefined;

    /**
     * Configs.
     * @member  {Config}
     */
    config = undefined;

    /**
     * Server.
     * @member  {Server}
     */
    server = null;

    /**
     * Constructor.
     * 
     * @param   {ProcessArgs}   processArgs Process arguments.
     * 
     * @return  {GreenFedora}
     */
    constructor(processArgs)
    {
        Benchmarks.getInstance().markStart('gf-constructor', 'Constructing GreenFedora');

        // Save the passed process arguments.
        this.processArgs = processArgs;

        // Set the log level here.
        syslog.setLevel(this.processArgs.level);

        // Load the configs.
        this.loadConfig();

        // Clean?
        this.cleanDirs();

        Benchmarks.getInstance().markEnd('gf-constructor');
    }

    /**
     * Load the configs.
     * 
     * @return  {void}
     */
    loadConfig()
    {
        Benchmarks.getInstance().markStart('gf-loadconf', 'Loading GreenFedora config');

        // Create the config.
        this.config = new Config(this.processArgs.input, this.processArgs.output, this.processArgs.config);
        debugdev(`Base config: %O`, this.config.getBaseConfig());

        // Process global data.
        let gd = GlobalDataFileConfig.getData(this.config);
        debugdev(`Global data file config: %O`, gd);

        // Load a bunch of defaults.
        this.config.postProcessing(true);

        Benchmarks.getInstance().markEnd('gf-loadconf');
    }

    /**
     * Initialisation.
     * 
     * @param   {boolean}           [watch=false]       Are we initialising for a watch?            
     * @param   {string[]|null}     [files=null]        Files to process or null to parse filesystem.
     * @param   {boolean}           [buildCss=false]    Force build of scss files?
     * 
     * @return  {Promise<boolean>}
     */
    async init(watch = false, files = null, buildCss = false)
    {
        Benchmarks.getInstance().markStart('gf-init', 'Initialisation');

        if (watch) {
            this.config.isWatcherRun = true;
            this.config.watcherTemplates = {};
        }

        await this.processFiles(files, buildCss);

        await this.config.eventManager.emit('INIT_FINISHED');

        Benchmarks.getInstance().markEnd('gf-init');
        return true;
    }

    /**
     * Clean up various directories.
     * 
     * @return  {void}
     */
    cleanDirs()
    {
        FsUtils.cleanDir(path.join(this.config.sitePath, this.config.getBaseConfig().locations.temp));
        if (this.processArgs.argv.clean) {
            syslog.notice(`Cleaning transitory directories due to '-clean' argument.`)
            FsUtils.cleanDir(this.config.outputPath);
            FsUtils.cleanDir(path.join(this.config.sitePath, this.config.getBaseConfig().locations.temp));
            FsUtils.cleanDir(path.join(this.config.sitePath, this.config.getBaseConfig().locations.cache))
        }
   }

    /**
     * Process necessary files.
     * 
     * @param   {string[]|null}     [files=null]        Files to process or null to parse filesystem.
     * @param   {boolean}           [buildCss=false]    Force build of scss files?
     * 
     * @return  {Promise<boolean>}
     */
    async processFiles(files = null, buildCss = false)
    {
        if (null === files) {
            // Grab the files from the filesystem.
            files = await this.parseFileSystem();
        } else if (!Array.isArray(files)) {
            files = [files];
        }

        // Filter 'just copy' files.
        let justcopy = files.filter(f => {
            for (let item of this.config.justCopy) {
                if (f.startsWith(item)) {
                    return f;
                }
            }
        });
        debugdev(`'Just Copy' files to process: %O`, justcopy);

        // Filter assets.
        let assets = files.filter(f => {
            if (this.config.assetManager.isHandled(path.extname(f)) && !justcopy.includes(f)) {
                return f;
            }
        });

        // If the -noimages flag is set, filter out image files.
        let doImages = true;
        if (this.processArgs.argv.noimages) {
            doImages = false;
        }
        /*
        if (this.processArgs.argv.noimages) {
            assets = assets.filter(f => {
                if (!this.config.getBaseConfig().defaultAssetProcessors.image.exts.includes(path.extname(f).substring(1))) {
                    return f;
                }
            });
        }
        */

        debugdev(`Asset files to process: %O`, assets);

        // Filter templates.
        let templates = files.filter(f => {
            if (this.config.templateManager.isHandled(path.extname(f)) && !justcopy.includes(f)) {
                return f;
            }
        });
        debugdev(`Template files to process: %O`, templates);


        // Process the asset files.
        await this.processAssetFiles(assets, doImages, buildCss);

        // Process the template files.
        await this.processTemplateFiles(templates);

        // Save the image info store.
        this.config.imageInfoStore.save();

        // Generate tag pages.
        await this.generateTagPages();

        // Process the just copy files.
        await this.processJustCopyFiles(justcopy);

        return true;
    }

    /**
     * Process template files.
     * 
     * @param   {string[]}  files   Files to process.
     * 
     * @return  {Promise<boolean>}
     */
    async processTemplateFiles(files)
    {
        Benchmarks.getInstance().markStart('gf-proctpl', 'Processing templates');
        await Promise.all(files.map(async file => {
            debug(`Processing template file: %s`, file);
            let fullPath = path.join(this.config.sitePath, file);
            await this.processSingleTemplateFile(fullPath);
        }));

        //syslog.inspect(this.config.layoutDependencies);
        //syslog.inspect(this.config.layoutDependencies.dependantsOf('_layouts/post.njk'))

        Benchmarks.getInstance().markEnd('gf-proctpl');
        return true;
    }

    /**
     * Process a single template file.
     * 
     * @param   {string}    filePath    Full file path to template.
     * 
     * @return  {Promise<boolean>}
     */
    async processSingleTemplateFile(filePath)
    {
        // Create and load a template file.
        let tpl = new TemplateFile(filePath, this.config);
        await tpl.load();

        // Use the relevant template processor to compile the file.
        let proc = this.config.getTemplateProcessorForFile(filePath);
        debug(`About to compile %s.`, tpl.relPath);

        // Save the returned renderer.
        tpl.renderer = await proc.compile(tpl);

        // Save the template.
        this.config.saveTemplate(tpl);

        // Extract collection data.
        let data = tpl.getData();
        if (data.collectionsToTrack) {
            for (let group of data.collectionsToTrack) {
                if (data[group]) {
                    let arr = data[group];
                    if (!Array.isArray(arr)) {
                        arr = [arr];
                    }
                    for (let coll of arr) {
                        this.config.addToCollection(group, coll, tpl);
                    }
                }
            }
        }

        await this.config.eventManager.emit('AFTER_PROCESS_SINGLE_TEMPLATE', this.config, tpl);

        return true;
    }

    /**
     * Process asset files.
     * 
     * @param   {string[]}  files               Files to process.
     * @param   {boolean}   [doImages=true]     Are we processing images?
     * @param   {boolean}   [buildCss=false]    Force build of scss files?
     * 
     * @return  {Promise<boolean>}
     */
    async processAssetFiles(files, doImages = true, buildCss = false)
    {        
        Benchmarks.getInstance().markStart('gf-procass', 'Processing assets');
        this.config.assetCache.load();

        await Promise.all(files.map(async file => {
            debug(`Processing template file: %s`, file);
            let fullPath = path.join(this.config.sitePath, file);
            await this.processSingleAssetFile(fullPath, doImages, buildCss);
        }));

        this.config.assetCache.save();

        await this.config.eventManager.emit('AFTER_PROCESS_ASSETS', this.config)
        Benchmarks.getInstance().markEnd('gf-procass');
        return true;
    }

    /**
     * Process a single asset file.
     * 
     * @param   {string}    filePath            Full file path to asset file.
     * @param   {boolean}   doImages            Are we processing images?
     * @param   {boolean}   [buildCss=false]    Force build of scss files?
     * 
     * @return  {Promise<boolean>}
     */
    async processSingleAssetFile(filePath, doImages = true, buildCss = false)
    {
        let ext = path.extname(filePath);
        let force = false;
        if (('.css' === ext || '.scss' === ext) && buildCss) {
            force = true;
        }

        if (this.config.assetCache.check(filePath) || force) {
            // Use the relevant template processor to compile the file.
            let proc = this.config.getAssetProcessorForFile(filePath);
            debug(`About to process asset %s.`, filePath.replace(this.config.sitePath, ''));

            // Process the file.
            if (this.config.getBaseConfig().defaultAssetProcessors.image.exts.includes(
                path.extname(filePath).substring(1))) {
                await proc.process(filePath, !doImages);
            } else {
                await proc.process(filePath);
            }
        }

        return true;
    }

    /**
     * Process just copy files.
     * 
     * @param   {string[]}  files   Files to process.
     * 
     * @return  {Promise<boolean>}
     */
    async processJustCopyFiles(files)
    {
        Benchmarks.getInstance().markStart('gf-procjc', 'Processing just copies');
        await Promise.all(files.map(async file => {
            debug(`Processing 'just copy' file: %s`, file);
            let fullPath = path.join(this.config.sitePath, file);
            let opPath = path.join(this.config.outputPath, file);
            if (!fs.existsSync(path.dirname(opPath))) {
                fs.mkdirSync(path.dirname(opPath), {recursive: true});
            }
            fs.copyFileSync(fullPath, opPath);
        }));

        Benchmarks.getInstance().markEnd('gf-procjc');
        return true;
    }

    /**
     * Rendering.
     * 
     * @return  {Promise<number>}        0 for success.
     */
    async render()
    {
        Benchmarks.getInstance().markStart('gf-render', 'Render');

        // Prev/next links.
        let colldata = this.config.collections.type.post.getAll('date-desc', true);
        Pagination.prevNext(colldata);

        // Render all the early templates.
        await this._renderParse('early');

        // Render all the late templates.
        await this._renderParse('late', {collections: this.config.collections});

        // Push any 'last' parsers through the system.
        let bc = this.config.getBaseConfig();
        let tmpDir = path.join(this.config.sitePath, bc.locations.temp);
        let fsp = FsParser.fromLocal(this.config, tmpDir);
        let files = await fsp.parse();
        await this.processTemplateFiles(files);

        // Render all the last templates.
        await this._renderParse('last', {collections: this.config.collections});

        await this.config.eventManager.emit('RENDER_FINISHED', this.config);
        Benchmarks.getInstance().markEnd('gf-render');
        return 0;
    }

    /**
     * Generate tags pages.
     * 
     * @return  {void}
     */
    async generateTagPages()
    {
        if (!this.config.collections.tags) {
            return;
        }

        let dummyPath = path.join(this.config.sitePath, this.config.getBaseConfig().locations.layouts, 
            'dummy', 'tag-tpl.njk');

        if (!fs.existsSync(dummyPath)) {
            throw new GfPaginationError(`No tag dummy file found at ${dummyPath}`);
        }

        let dummyData = fs.readFileSync(dummyPath, 'utf-8');

        let tmpPath = path.join(this.config.sitePath, this.config.getBaseConfig().locations.temp, 'tagpages');
        //if (fs.existsSync(tmpPath)) {
        //    FsUtils.deleteFolderRecursive(tmpPath);
        //}
        fs.mkdirSync(tmpPath, {recursive: true});

        let keys = Object.keys(Collection.getStats(this.config.collections.tags));

        await Promise.all(keys.map(tag => {
            let slug = GfString.slugify(tag);
            let fn = path.join(tmpPath, slug + '.njk');
            let op = GfString.replaceAll(dummyData, '[[tag]]', tag);
            //op = GfString.replaceAll(op, '[[tag-slug]]', slug);
            fs.writeFileSync(fn, op, 'utf-8');
        }));

    }

    /**
     * Render an individual parse.
     * 
     * @param   {string}    parse       Parse to render.
     * @param   {object}    extraData   Extra data to merge in for the parse.
     * 
     * @return  {void}
     */
    async _renderParse(parse, extraData = null)
    {
        Benchmarks.getInstance().markStart('gf-render-' + parse, 'Render' + ' (' + parse + ')');

        let tpls = Object.values(this.config.getTemplates());

        let todo;
        if ('late' === parse) {
            todo = tpls.filter(t => {
                let d = t.getData();
                if (d.parse && 'late' === d.parse) {
                    return t;
                }  
            });
        } else if ('last' === parse) {
            todo = tpls.filter(t => {
                let d = t.getData();
                if (d.parse && 'last' === d.parse) {
                    return t;
                }  
            });

        } else {
            todo = tpls.filter(t => {
                let d = t.getData();
                if (!d.parse || ('late' !== d.parse && 'last' !== d.parse)) {
                    return t;
                }  
            });
        }

        await Promise.all(todo.map(async tpl => {
            syslog.log(`Rendering ${tpl.relPath}.`);

            tpl.addComputedData();
            tpl.addComputedLateData();
            let data = tpl.getData(true);

            if (null !== extraData) {
                data = Merge.merge(data, extraData);
            }

            let op = await tpl.render(data);

            let opFile = path.join(this.config.outputPath, data.permalink);
            if ('' === path.extname(opFile)) {
                opFile = path.join(opFile, 'index.html');
            }
            if (!fs.existsSync(path.dirname(opFile))) {
                fs.mkdirSync(path.dirname(opFile), {recursive: true});
            }
            fs.writeFileSync(opFile, beautify(op), 'utf-8');

        }));

        Benchmarks.getInstance().markEnd('gf-render-' + parse);

    }

    /**
     * Start the server.
     * 
     * @return  {number}
     */
    async serve()
    {
        let result = await this.render();
        if (result.error) {
            return Promise.reject(result.error);
        }  

        this.server = new Server(this.config, parseInt(this.processArgs.argv.port));
        this.server.start();
        return 0;
    }

    /**
     * Process a watcher run.
     * 
     * @param   {string[]}  files       Files to process.
     * @param   {boolean}   buildCss    Process buind of (S)CSS?
     * 
     * @return  {void}
     */
    async processWatch(files, buildCss = false)
    {
        await this.init(true, files, buildCss);
        await this.render();
        this.config.copyWatcherTemplates();
        this.config.watcherRun = false;
    }

    /**
     * Start the watcher.
     * 
     * @return
     */
    async watch()
    {
        await this.serve();

        let watcher = new Watcher(this.config, this, this.server);
        watcher.watch();
    }

    /**
     * Parse the file system.
     * 
     * @return  {string[]}      Array of file names.
     */
    async parseFileSystem()
    {
        Benchmarks.getInstance().markStart('gf-fsparse', 'File system parse');
        let fsp = FsParser.fromLocal(this.config);
        let ret = await fsp.parse();
        Benchmarks.getInstance().markEnd('gf-fsparse');
        return ret;
    }

    /**
     * Return the version.
     * 
     * @return  {string}
     * @static
     */
    static version()
    {
        return gfpkg.version;
    }

}

module.exports = GreenFedora;