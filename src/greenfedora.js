/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const gfpkg = require("../package.json");
const { syslog } = require('./utils/logger');
const path = require('path');
const Config = require("./config");
const TemplateFile = require('./template/file/templateFile');
const GlobalDataFileConfig = require('./config/globalDataFileConfig');
const GfError = require('./utils/gfError');
const FsParser = require('./utils/fsParser');
const Benchmarks = require('./utils/benchmarks');
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

        // Create the config.
        this.config = new Config(processArgs.input, processArgs.output, processArgs.config);
        debugdev(`Base config: %O`, this.config.getBaseConfig());

        // Process global data.
        let gd = GlobalDataFileConfig.getData(this.config);
        debugdev(`Global data file config: %O`, gd);

        // Load a bunch of defaults.
        this.config.postProcessing();

        Benchmarks.getInstance().markEnd('gf-constructor');
    }

    /**
     * Initialisation.
     * 
     * @return  {Promise<boolean>}
     */
    async init()
    {
        Benchmarks.getInstance().markStart('gf-init', 'Initialisation');

        await this.processFiles();

        Benchmarks.getInstance().markEnd('gf-init');
        return true;
    }

    /**
     * Process necessary files.
     * 
     * @param   {string[]|null}     [files=null]    Files to process or null to parse filesystem.
     * 
     * @return  {Promise<boolean>}
     */
    async processFiles(files = null)
    {
        if (null === files) {
            // Grab the files from the filesystem.
            files = await this.parseFileSystem();
        } else if (!Array.isArray(files)) {
            files = [files];
        }

        // Filter assets.
        let assets = files.filter(f => {
            if (this.config.assetManager.isHandled(path.extname(f))) {
                return f;
            }
        });
        debugdev(`Asset files to process: %O`, assets);

        // Filter templates.
        let templates = files.filter(f => {
            if (this.config.templateManager.isHandled(path.extname(f))) {
                return f;
            }
        });
        debugdev(`Template files to process: %O`, templates);

        // Process the asset files.
        await this.processAssetFiles(assets);

        // Process the template files.
        await this.processTemplateFiles(templates);

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

        return true;
    }

    /**
     * Process asset files.
     * 
     * @param   {string[]}  files   Files to process.
     * 
     * @return  {Promise<boolean>}
     */
    async processAssetFiles(files)
    {
        Benchmarks.getInstance().markStart('gf-procass', 'Processing assets');
        await Promise.all(files.map(async file => {
            debug(`Processing template file: %s`, file);
            let fullPath = path.join(this.config.sitePath, file);
            await this.processSingleAssetFile(fullPath);
        }));

        Benchmarks.getInstance().markEnd('gf-procass');
        return true;
    }

    /**
     * Process a single asset file.
     * 
     * @param   {string}    filePath    Full file path to asset file.
     * 
     * @return  {Promise<boolean>}
     */
    async processSingleAssetFile(filePath)
    {
        // Use the relevant template processor to compile the file.
        let proc = this.config.getAssetProcessorForFile(filePath);
        debug(`About to process asset %s.`, filePath.replace(this.config.sitePath, ''));

        // Process the file.
        proc.process(filePath);

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
        // Render all the templates.
        let tpls = this.config.getTemplates('values');
        await Promise.all(tpls.map(async tpl => {
            let data = await tpl.renderData();
            syslog.log(`Rendering ${tpl.relPath}.`);
            //syslog.inspect(data);
            let op = await tpl.renderer(data);
            //syslog.inspect(op);
        }));

        Benchmarks.getInstance().markEnd('gf-render');
        return 0;
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