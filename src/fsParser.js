/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const fg = require('fast-glob');
const { syslog, GfPath } = require('greenfedora-utils');
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
     * @param   {string}        pathOverride    Override the start path.
     * 
     * @return  {FsParser}
     * @static
     */
    static fromLocal(config, pathOverride = null)
    {
        // Get the options.
        let cfg = config.getBaseConfig();
        let options = cfg.fsParser.options;
        let prefix = '';
        if (pathOverride) {
            options.base = pathOverride;
            options.ignore = [];
            prefix = GfPath.addTrailingSlash(GfPath.removeLeadingSlash(pathOverride.replace(config.sitePath, '')));
        } else {
            options.base = config.sitePath;
        }

        // Collate the extensions we're interested in.
        let includes = [];
        if (config.templateManager.processorExts) {
            for (let ext in config.templateManager.processorExts) {
                includes.push(prefix + '**.' + ext);
            }
        }
        if (config.assetManager.processorExts) {
            for (let ext in config.assetManager.processorExts) {
                includes.push(prefix + '**.' + ext);
            }
        }

        // We need the 'Just Copy' stuff.
        if (!pathOverride && config.justCopy.length > 0) {
            for (let p of config.justCopy) {
                includes.push(prefix + p + '**');
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
