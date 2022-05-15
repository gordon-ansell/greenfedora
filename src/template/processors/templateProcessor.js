/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';
const ResourceProcessor = require('../../resource/processors/resourceProcessor');
const debug = require("debug")("GreenFedora:TemplateProcessor");

/**
 * Template processing (base) class.
 */
class TemplateProcessor extends ResourceProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Configs.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {TemplateProcessor}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);
    }

    /**
     * See if the passed string needs compilation.
     * 
     * @param   {string}    str     String to check.
     * 
     * @return  {boolean}   
     */
    needsCompliation(str)
    {
        let tags = {};

        if (this.engine.options && this.engine.options.tags) {
            tags = this.engine.options.tags;
        }

        let bs = tags.blockStart || "{%";
        let vs = tags.variableStart || "{{";
        let cs = tags.commentStart || "{#";

        for (let chk of [bs, vs, cs]) {
            if (-1 !== str.indexOf(chk)) {
                return true;
            }
        }

        return false;
    }
}

module.exports = TemplateProcessor;