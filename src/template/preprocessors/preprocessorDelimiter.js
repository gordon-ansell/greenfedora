/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { Preprocessor, GfError, GfString } = require('greenfedora-utils');
const debug = require("debug")("GreenFedora:PreprocessorDelimiter");

// Local error.
class GfPreprocessorDelimiterError extends GfError {};

/**
 * Preprocess delimiters.
 */
class PreprocessorDelimiter extends Preprocessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config      Configs.
     * 
     * @return  {PreprocessorDelimiter}
     */
    constructor(config)
    {
        super('delimiter', config);
    }

    /**
     * Preprocess a string.
     * 
     * @param   {string}    content     Content to preprocess.
     * @param   {string}    filePath    File path.
     * @param   {boolean}   [rss=false] For RSS?
     * 
     * @return  {string}
     */
    preprocessString(content, filePath, rss = false)
    {
        debug(`Preprocessing delimiters for ${filePath}`);

        if ("string" != typeof content) {
            throw new GfPreprocessorDelimiterError(`The 'content' passes tp the delimiter preprocessor must be a string, we got '${typeof content}'. Processing ${filePath}.`)
        }

        if (-1 !== content.indexOf('{ldelim}') || -1 !== content.indexOf('{rdelim}')) {
            let ret = GfString.replaceAll(content, '{ldelim}', '{');
            ret = GfString.replaceAll(ret, '{rdelim}', '}');
            return ret;
        }

        return content;
    }
}

module.exports = PreprocessorDelimiter;