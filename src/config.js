/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfPath, GfError, Merge, EventManager } = require('greenfedora-utils');
const path = require('path');
const fs = require('fs');
const PluginManager = require('./config/pluginManager');
const TemplateManager = require('./config/templateManager');
const AssetManager = require('./config/assetManager');
const os = require('os');
const constants = require('./config/constants');
const debug = require("debug")("GreenFedora:Config");

// Local error.
class GfConfigError extends GfError {};


/**
 * Configuration class.
 * 
 * The different configs are:
 * 
 *  -   defaultConfig from greenfedora/src/defaultConfig.js.
 *  -   pluginConfig from any loaded plugins.
 *  -   localConfig from userproj/.grnfdr.js (unless it is overloaded with --config).
 *  -   inputConfig from this (Config) class constructor.
 * 
 * Then elsewhere, we load:
 * 
 *  -   API global data.
 *  -   Global data file config (from the _data directory).
 * 
 *  -   Layout data.
 *  -   Directory data files.
 *  -   Template data.
 *  -   Computed data.
 */
class Config
{
    /**
     * =========================================================================
     * INPUTS
     * =========================================================================
     */

    /**
     * Site path.
     * @member  {string}
     */
    sitePath = null;

    /**
     * Output path.
     * @member  {string}
     */
    outputPath = null;

    /**
     * Local config path.
     * @member  {string}
     */
    localConfigPath = null;

    /**
     * Hostname.
     * @member  {string}
     */
    hostname = null;

    /**
     * =========================================================================
     * BASE CONFIG
     * =========================================================================
     */

    /**
     * Default config (./defaultConfig.js).
     * @member  {object}
     */
    defaultConfig = null;

    /**
     * Local config (./grnfdr.js in the user's site).
     * @member  {object}
     */
    localConfig = null;

    /**
     * Plugin config (returned by plugins).
     * @member {object}
     */
    pluginConfig = null;

    /**
     * Input config (passed into this class).
     * @member {object}
     */
    inputConfig = null;

    /**
     * Has the config merged?
     * @member  {boolean}
     */
    hasMerged = false;

    /**
     * The actual data of the full config after merge.
     * @member  {object}
     */
    baseConfig = null;

    /**
     * Global API data.
     * @member  {object}
     */
    globalData = {};

    /**
     * =========================================================================
     * USER CONFIG
     * =========================================================================
     */

    /**
     * Event manager.
     * @member {EventManager}
     */
    eventManager = null;

    /**
     * Plugin manager,
     * @member  {PluginManager}
     */
    pluginManager = null;

    /**
     * Template manager.
     * @member  {TemplateManager}
     */
    templateManager = null;

    /**
     * Asset manager.
     * @member  {AssetManager}
     */
    assetManager = null;

    /**
     * Saved templates.
     * @member  {Map}
     */
    templates = null;

    /**
     * Just copy things.
     * @member  {string[]}
     */
    justCopy = [];


    /**
     * Constructor.
     * 
     * @param   {string}    sitePath                    Path to the user's site project.
     * @param   {string}    outputPath                  Where we write the output.
     * @param   {string}    [localConfigPath=null]      Path to local config.
     * @param   {object}    [inputConfig={}]            Config values passed in.
     * 
     * @return  {Config}
     */
    constructor(sitePath, outputPath, localConfigPath = null, inputConfig = {})
    {
        // Save the passed site and output paths.
        this.sitePath = GfPath.addTrailingSlash(path.resolve(sitePath));
        this.outputPath = GfPath.addTrailingSlash(path.resolve(outputPath));

        // If we don't have a local config path, use the default.
        if (null === this.localConfigPath) {
            this.localConfigPath = path.join(this.sitePath, constants.CONTROL_FILE_NAME);
        } else {
            this.localConfigPath = GfPath.addTrailingSlash(path.resolve(localConfigPath));
        }

        // Save the input config.
        this.inputConfig = inputConfig;
        debug(`Input config loaded: %o`, this.inputConfig);

        // Initialise all fields.
        this.reset();

    }

    /**
     * Reset the config.
     * 
     * @return  {void}
     */
    reset()
    {
        debug(`Resetting configs.`);

        // User config items.
        this.eventManager = new EventManager(constants.EVENTS);
        this.pluginManager = new PluginManager(this);
        this.templateManager = new TemplateManager(this);
        this.assetManager = new AssetManager(this);
        this.templates = new Map();
        this.justCopy = [];

        // Base config items.
        this.globalData = {};
        this.loadDefaultConfig();
        this.getBaseConfig(true);
    }

    /**
     * =========================================================================
     * BASE CONFIG DATA
     * =========================================================================
     */

    /**
     * Load the default config.
     * 
     * @return  {void}
     */
    loadDefaultConfig()
    {
        this.defaultConfig = require('./config/defaultConfig');
        if ('function' === typeof this.defaultConfig) {
            this.defaultConfig = this.defaultConfig.call(this, this.userConfig);
        }
        debug(`Default config loaded: %o`, this.defaultConfig);
    }

    /**
     * Load the local config.
     * 
     * @return  {void}
     * 
     * @throws  {GfConfigError}     On any problem.
     */
    loadLocalConfig()
    {
        if (fs.existsSync(this.localConfigPath)) {

            try {
                this.localConfig = require(this.localConfigPath);
                if ('function' === typeof this.localConfig) {
                    this.localConfig = this.localConfig.call(this, this);
                }
                debug(`Local config loaded: %o`, this.localConfig);
            } catch (err) {
                throw new GfConfigError(`Unable to load local (.grnfdr) config file.`, null, err);
            }

        } else {
            syslog.warning(`No local config found at path (may not be a problem if you chose not to have one): ${this.localConfigPath}`);
        }
    }

    /**
     * Load the plugins.
     * 
     * @return  {void}
     */
    loadPlugins()
    {
        this.pluginConfig = this.pluginManager.loadPlugins();
    }

    /**
     * Apply extractions to the configs.
     * 
     * @return  {void}
     */
    applyExtractions()
    {
        // Save the mode.
        if (!this.config.mode) {
            this.config.mode = process.env.GF_MODE || 'dev';
        }

        // Work out the hostname.
        if (this.config.modehost && this.config.mode && this.config.modehost[this.config.mode]) {
            let hd = this.config.modehost[this.config.mode];
            let calchost = 'http';
            if (hd.ssl) {
                calchost += 's';
            } 
            calchost += '://';
            if (hd.host) {
                calchost += hd.host;
            } else {
                throw new GfConfigError(`The config 'modehost' setting needs a 'host' value for '${this.config.mode}'`);
            }
            if (hd.port) {
                calchost += ':' + hd.port;
            }
            this.hostname = calchost;
        } else {
            this.hostname = os.hostname();
        }
    }

    /**
     * Merge the default and local configs.
     * 
     * @return  {void}
     */
    mergeConfigs()
    {
        let merged;
        try { 
            merged = Merge.mergeMany([this.defaultConfig, this.pluginConfig, this.localConfig, this.inputConfig]);
        } catch (err) {
            throw new GfConfigError(`Hmm, failed to merge all the configs.`, null, err);
        }
        debug(`Merged (default, plugin, local & input) configs: %o`, merged);
        return merged;
    }

    /**
     * Retrieve the base config. Load amd merge the local config first.
     * 
     * @param   {boolean}   [forceReload=false]     Force a reload.
     * 
     * @return  {object}
     */
    getBaseConfig(forceReload = false)
    {
        if (forceReload) {
            this.hasMerged = false;
        }
        // NOTE: don't call getBaseConfig in any of these or we'll loop eternally.
        if (!this.hasMerged) {
            this.loadLocalConfig();
            this.loadPlugins();
            this.config = this.mergeConfigs();
            this.applyExtractions();
            this.hasMerged = true;
        }
        return this.config;
    }

    /**
     * Do the default post-processing.
     * 
     * @return  {void}
     */
    postProcessing()
    {
        this.addDefaultTemplateProcessors();
        this.addDefaultAssetProcessors();
    }

    /**
     * =========================================================================
     * TEMPLATE STUFF
     * =========================================================================
     */

    /**
     * Add a template processor.
     * 
     * @param   {string}                name        Name of the template processor.
     * @param   {TemplateProcessor}     instance    Template processor instance.
     * @param   {string|string[]}       exts        Extensions to handle.
     * 
     * @return  {Config}
     */
    addTemplateProcessor(name, instance, exts)
    {
        this.templateManager.addProcessor(name, instance, exts);
        return this;
    }

    /**
     * Add a template processor mod.
     * 
     * @param   {string}                    proc                Processor name.                      
     * @param   {filters|preProcessors}     type                Type.
     * @param   {string}                    name                Name.
     * @param   {function}                  func                Function to call.
     * @param   {boolean}                   [preserve=false]    Protect against overwrite?
     * @param   {boolean}                   [isAsync=false]     Well, is it?
     * 
     * @return  {Config}
     */
    addTemplateProcessorMod(proc, type, name, func, preserve = false, isAsync = false)
    {
        this.templateManager.addProcessorMod(type, name, func, preserve, isAsync);
        return this;
    }

    /**
     * Add the default template processors.
     * 
     * @return  {Config}
     */
    addDefaultTemplateProcessors()
    {
        this.templateManager.addDefaultProcessors();
        this.templateManager.addDefaultProcessorMods();
        return this;
    }

    /**
     * See if the passed extension is a template with a handler.
     * 
     * @param   {string}    ext         Extension to check.
     * 
     * @return  {boolean}
     */
    isHandledTemplate(ext) 
    {
        return this.templateManager.isHandled(ext);
    }

    /**
     * Get a template processor.
     * 
     * @param   {string}    name        Name to get it for.
     * 
     * @return  {TemplateProcessor}
     */
    getTemplateProcessor(name)
    {
        return this.templateManager.getProcessor(name);
    }

    /**
     * Get the template processor for a given extension.
     * 
     * @param   {string}    ext         Extension to get processor for.
     * 
     * @return  {TemplateProcessor}
     */
    getTemplateProcessorForExt(ext)
    {
        return this.templateManager.getProcessorForExt(ext);
    }

    /**
     * Get the template processor for a given file.
     * 
     * @param   {string}    filePath    File to get processor for.
     * 
     * @return  {TemplateProcessor}
     */
    getTemplateProcessorForFile(filePath)
    {
        return this.templateManager.getProcessorForFile(filePath);
    }

    /**
     * =========================================================================
     * ASSET STUFF
     * =========================================================================
     */

    /**
     * Add an asset processor.
     * 
     * @param   {string}                name        Name of the asset processor.
     * @param   {AssetProcessor}        instance    Asset processor instance.
     * @param   {string|string[]}       exts        Extensions to handle.
     * 
     * @return  {Config}
     */
    addAssetProcessor(name, instance, exts)
    {
        this.assetManager.addProcessor(name, instance, exts);
        return this;
    }

    /**
     * Add the default asset processors.
     * 
     * @return  {Config}
     */
    addDefaultAssetProcessors()
    {
        this.assetManager.addDefaultProcessors();
        return this;
    }

    /**
     * See if the passed extension is an asset with a handler.
     * 
     * @param   {string}    ext         Extension to check.
     * 
     * @return  {boolean}
     */
    isHandledAsset(ext) 
    {
        return this.assetManager.isHandled(ext);
    }

    /**
     * Get an asset processor.
     * 
     * @param   {string}    name        Name to get it for.
     * 
     * @return  {AssetProcessor}
     */
    getAssetProcessor(name)
    {
        return this.assetManager.getProcessor();
    }

    /**
     * Get the asset processor for a given extension.
     * 
     * @param   {string}    ext         Extension to get processor for.
     * 
     * @return  {AssetProcessor}
     */
    getAssetProcessorForExt(ext)
    {
        return this.assetManager.getProcessorForExt(ext);
    }

    /**
     * Get the asset processor for a given file.
     * 
     * @param   {string}    filePath    File to get processor for.
     * 
     * @return  {AssetProcessor}
     */
    getAssetProcessorForFile(filePath)
    {
        return this.assetManager.getProcessorForFile(filePath);
    }

    /**
     * =========================================================================
     * PLUGINS
     * =========================================================================
     */

    /**
     * Add a plugin.
     * 
     * @param   {callable}      plugin          Something to execute.
     * @param   {object}        [options={}]    Plugin options.
     * 
     * @return  {UserConfig}
     */
    addPlugin(plugin, options = {})
    {
        this.pluginManager.addPlugin(plugin, options);
        return this;
    }

    /**
     * Add a built-in plugin.
     * 
     * @param   {string}        pluginName      Built-in plugin name.
     * @param   {object}        [options={}]    Plugin options.
     * 
     * @return  {UserConfig}
     */
    addBuiltInPlugin(pluginName, options = {})
    {
        this.pluginManager.addBuiltInPlugin(pluginName, options);
        return this;
    }

    /**
     * =========================================================================
     * API GLOBAL DATA
     * =========================================================================
     */

    /**
     * Add global data.
     * 
     * @param   {string}    name    Data key.
     * @param   {any}       val     Data value.
     * 
     * @return  {UserConfig}
     */
    addGlobalData(name, val) 
    {
        this.globalData[name] = val;
        return this;
    }

    /**
     * Get global data.
     * 
     * @param   {string|null}   [name=null]     Name of field or null for all.
     * 
     * @return  {object|any}
     */
    getGlobalData(name = null)
    {
        if (null === name) {
            return this.globalData;
        }

        if (name in this.globalData)  {
            return  this.globalData[name];
        }

        return null;
    }

    /**
     * =========================================================================
     * INTERIM TEMPLATES
     * =========================================================================
     */

    /**
     * Save a template.
     * 
     * @param   {TemplateFile}  tpl     Template file to save.
     * 
     * @return  {Config}
     */
    saveTemplate(tpl)
    {
        this.templates.set(tpl.relPath, tpl);
        return this;
    }

    /**
     * Get the saved templates.
     * 
     * @param   {"map"|"values"|"entries"|"keys"}   [format="map"]     Return it as required.
     * 
     * @return  {Map|TemplateFile[]}
     */
    getTemplates(format = "map")
    {
        if ("values" === format) {
            return [...this.templates.values()];
        } else if ("entries" === format) {
            return [...this.templates.entries()]
        } else if ("keys" === format) {
            return [...this.templates.keys()]
        }
        return this.templates;
    }

    /**
     * =========================================================================
     * UTILITY
     * =========================================================================
     */

    /**
     * Add a file or path ti the 'just copy' list.
     * 
     * @param   {string|string[]}    pathLike    File/path/dir, string or array of.
     * 
     * @return  {Config}
     */
    addJustCopy(pathLike)
    {
        if (!Array.isArray(pathLike)) {
            pathLike = [pathLike];
        }
        for (let p of pathLike) {
            this.justCopy.push(GfPath.removeLeadingSlash(p));
        }
        return this;
    }
}

module.exports = Config;