/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require('greenfedora-utils');
const path = require('path');
const fs = require('fs');
const fmparse = require('gray-matter');
const debug = require("debug")("GreenFedora:DataFileLoader");

// Local error.
class GfDataFileLoaderError extends GfError {};

/**
 * Load a data file.
 */
class DataFileLoader
{

    /**
     * Load the file.
     * 
     * @param   {string}    filePath    Path to file to load.
     * @param   {Config}    config      Config object.
     * 
     * @return  {object}
     */
    static load(filePath, config)
    {
        let data = {};

        if ('.yaml' === path.extname(filePath)) {
            data = DataFileLoader.readYaml(filePath);
        } else if ('.json' === path.extname(filePath)) {
            data = DataFileLoader.readJson(filePath);
        } else if ('.js' === path.extname(filePath)) {
            data = DataFileLoader.readJavascript(filePath, config);
        } else {
            debug(`Ignoring data file config for %s - no extension match.`, filePath);
        }

        return data;
    }

    /**
     * Read a YAML file.
     * 
     * @param   {string}    filePath    File to read.
     * 
     * @return  {object}
     * 
     * @throws  {GfDataFileLoaderError}   On error.
     */
    static readYaml(filePath)
    {
        debug(`Reading data file config (YAML) from: %s`, filePath);

        let ret = {};

        let content;
        try {
            content = fs.readFileSync(filePath, "utf8");
        } catch (err) {
            throw new GfDataFileLoaderError(`Unable to read data file: ${filePath}.`, null, err);
        }
        
        if (content) {
            let data;
            try {
                data = fmparse("---\n" + content + "\n---\n", {});
            } catch (err) {
                throw new GfDataFileLoaderError(`Unable to parse data file: ${filePath}.`, null, err);
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
    static readJson(filePath)
    {
        debug(`Reading data file config (JSON) from: %s`, filePath);
        return require(filePath);
    }

    /**
     * Read a Javascript file.
     * 
     * @param   {string}    filePath    File to read.
     * @param   {Config}    config      Config object.
     * 
     * @return  {object}
     * 
     * @throws  {GfDataFileLoaderErrors}   On error.
     */
    static readJavascript(filePath, config)
    {
        let ret = {};

        debug(`Reading data file config (Javascript) from: %s`, filePath);
        let f = require(filePath);

        if ('function' !== typeof f) {
            throw new GfDataFileLoaderError(`Javascript data files must be functions: ${filePath}`);
        }

        try {
            ret = f(config);
        } catch (err) {
            throw new GfDataFileLoaderError(`Unable to parse data file: ${filePath}.`, null, err);
        }

        return ret;
    }

}

module.exports = DataFileLoader;