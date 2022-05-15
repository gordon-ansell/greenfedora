/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const fg = require('fast-glob');
const debug = require("debug")("GreenFedora:FsParser");

/**
 * Filesystem parser.
 */
class FsParser {

    /**
     * Includes.
     * @member  {string[]}
     */
    includes = [];

    /**
     * Options.
     * @member  {object}
     */
    options = {};

    /**
     * Constructor
     * 
     * @param   {string[]}      includes        Patterns to include.
     * @param   {object}        [options={}]    Fast glob options.
     * 
     * @return  {FsParser}
     */
    constructor(includes, options = {})
    {
        this.includes = includes;
        this.options = options;
    }

    /**
     * Create an instance from the local environment.
     * 
     * @param   {Config}        config          Local config.
     * 
     * @return  {FsParser}
     * @static
     */
    static fromLocal(config)
    {
        // Get the options.
        let cfg = config.getBaseConfig();
        let options = cfg.fsParser.options;
        options.base = config.sitePath;

        // Collate the extensions we're interested in.
        let includes = [];
        if (config.templateManager.processorExts) {
            for (let ext in config.templateManager.processorExts) {
                includes.push('**.' + ext);
            }
        }
        if (config.assetManager.processorExts) {
            for (let ext in config.assetManager.processorExts) {
                includes.push('**.' + ext);
            }
        }

        // Return new object.
        return new FsParser(includes, options);
    }

    /**
     * Parse the filesystem.
     * 
     * @return  {Promise<string[]>}          Array of matched files.
     */
    async parse()
    {
        return await fg(this.includes, this.options);
    }

}

module.exports = FsParser;
