/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const GfError = require('../utils/gfError');
const GfPath = require('../utils/gfPath');
const Merge = require('../utils/merge');
const DataFileLoader = require('./dataFileLoader');
const path = require('path');
const fs = require('fs');
const fmparse = require('gray-matter');
const { syslog } = require('../utils/logger');
const debug = require("debug")("GreenFedora:GlobalDataFileConfig");

// Local error.
class GfGlobalDataFileConfigError extends GfError {};

/**
 * Global data file reader.
 */
class GlobalDataFileConfig 
{
    /**
     * Configs.
     * @member  {Config}
     */
    config = null;

    /**
     * Global data itself.
     * @member  {object}
     */
    globalData = {};

    /**
     * Static instance.
     * @member {GlobalDataFileConfig}
     * @static
     */
    static instance = null;

    /**
     * Constructor.
     * 
     * @param   {Config}    config      Config object.
     * 
     * @return  {GlobalDataFiles}
     */
    constructor(config)
    {
        this.config = config;
    }

    /**
     * Instance creator.
     * 
     * @param   {Config}    config      Config object.
     * 
     * @return  {GlobalDataFileConfig}
     * @static
     */
    static getInstance(config)
    {
        if (null === GlobalDataFileConfig.instance) {
            GlobalDataFileConfig.instance = new GlobalDataFileConfig(config);
        }
        return GlobalDataFileConfig.instance;
    }

    /**
     * Get the data.
     * 
     * @param   {Config}    config      Config object.
     * 
     * @return  {object}
     * @static
     */
    static getData(config)
    {
        return GlobalDataFileConfig.getInstance(config).load();
    }

    /**
     * Load the blobal data files.
     * 
     * @return  {object}
     */
    load()
    {
        let bc = this.config.getBaseConfig();
        let gdPath = path.join(this.config.sitePath, bc.locations.data || '_data');

        if (fs.existsSync(gdPath)) {
            this.processDir(gdPath);
        }

        return this.globalData;
    }

    /**
     * Process a directory.
     * 
     * @param   {string}    dirPath     Directory path.
     */
    processDir(dirPath)
    {
        debug(`Processing global data file config directory: %s`, dirPath);
        let entries = fs.readdirSync(dirPath);
        let bc = this.config.getBaseConfig();

        for (let f of entries) {

            let full = path.join(dirPath, f);
            let stats = fs.statSync(full);
            let data = {};

            if (stats.isFile()) {
                data = DataFileLoader.load(full, this.config);

                if (data) {
                    let relevantPath = path.dirname(full).replace(path.join(this.config.sitePath, bc.locations.data), '');
                    relevantPath = path.join(relevantPath, path.basename(full, path.extname(full)));
                    let newData = GfPath.dataToObjectPath(relevantPath, data);
                    this.globalData = Merge.merge(this.globalData, newData);     
                }

            } else if (stats.isDirectory()) {
                this.processDir(path.join(dirPath, f));
            }

        }
    }

    /**
     * Read a YAML file.
     * 
     * @param   {string}    filePath    File to read.
     * 
     * @return  {object}
     * 
     * @throws  {GfGlobalDataFileConfigError}   On error.
     */
    readYaml(filePath)
    {
        let relPath = filePath.replace(this.config.sitePath, '');
        debug(`Reading global data file config (YAML) from: %s`, relPath);

        let ret = {};

        let content;
        try {
            content = fs.readFileSync(filePath, "utf8");
        } catch (err) {
            throw new GfGlobalDataFileConfigError(`Unable to read global data file: ${relPath}.`, null, err);
        }
        
        if (content) {
            let data;
            try {
                data = fmparse("---\n" + content + "\n---\n", {});
            } catch (err) {
                throw new GfGlobalDataFileConfigError(`Unable to parse global data file: ${relPath}.`, null, err);
            }
            ret = data.data;
        }

        return ret;
    }

    /**
     * Read a JSON file.
     * 
     * @param   {string}    filePath    File to read.
     * 
     * @return  {object}
     */
    readJson(filePath)
    {
        let relPath = filePath.replace(this.config.sitePath, '');
        debug(`Reading global data file config (JSON) from: %s`, relPath);
        return require(filePath);
    }

    /**
     * Read a Javascript file.
     * 
     * @param   {string}    filePath    File to read.
     * 
     * @return  {object}
     * 
     * @throws  {GfGlobalDataFileConfigError}   On error.
     */
    readJavascript(filePath)
    {
        let ret = {};

        let relPath = filePath.replace(this.config.sitePath, '');
        debug(`Reading global data file config (Javascript) from: %s`, relPath);
        let f = require(filePath);

        if ('function' !== typeof f) {
            throw new GfGlobalDataFileConfigError(`Javascript global data files must be functions: ${relPath}`);
        }

        try {
            ret = f(this.config);
        } catch (err) {
            throw new GfGlobalDataFileConfigError(`Unable to parse global data file: ${relPath}.`, null, err);
        }

        return ret;
    }

}

module.exports = GlobalDataFileConfig;
