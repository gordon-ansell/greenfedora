/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const TemplateProcessor = require('./templateProcessor');
const showdown = require('showdown');
const GfError = require('../../utils/gfError');
const TemplateFile = require('../file/templateFile');
const { syslog } = require('../../utils/logger');
const debug = require("debug")("GreenFedora:TemplateProcessorMarkdown");

// Local error.
class GfTemplateProcessorMarkdownError extends GfError {};

/**
 * Template processing for markdown.
 */
class TemplateProcessorMarkdown extends TemplateProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Configs.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {TemplateProcessorMarkdown}
     * 
     * @throws  {GfTemplateProcessorMarkdownError}  On error.
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);

        try {
            this.engine = new showdown.Converter(this.engineOptions);
        } catch (err) {
            throw new GfTemplateProcessorMarkdownError(`Unable to create markdown engine`, null, err);
        }

        debug(`Loaded markdown template processor.`);
    }

    /**
     * Compile a string.
     * 
     * @param   {TemplateFile}      tpl         Template file to process.
     * 
     * @return  {Promise<function>}
     * 
     * @throws  {GfTemplateProcessorMarkdownError}  On error.
     */
    async compile(tpl)
    {
        // Sanity check.
        if (!tpl instanceof TemplateFile) {
            throw new GfTemplateProcessorMarkdownError(`Template files should be an instance of 'TemplateFile'. Processing ${tpl.relPath}.`);
        }

        // Get the template data.
        let data = tpl.templateData.mergeData();

        for (let f of this.options.compileFields) {
            if (f.startsWith('data.') && data[f]) {
                tpl.templateData.frontMatterData[f] = this.engine.makeHtml(data[f]);
            } else if (tpl.extracted[f]) {
                tpl.extracted[f] = this.engine.makeHtml(tpl.extracted[f]);
            } else {
                debug(`No '${f}' field found in data or extracts for ${tpl.relPath}`);
            }
        }

        let ltpName = this.options.layoutTemplateProcessor;
        let ltp = this.config.getTemplateProcessor(ltpName);

        //syslog.inspect(tpl.dump());

        return ltp.compile(tpl.layout);

    }

}

module.exports = TemplateProcessorMarkdown;