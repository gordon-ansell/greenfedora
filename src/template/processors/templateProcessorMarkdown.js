/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const showdown = require('showdown');
const { GfError, syslog, TemplateProcessor } = require('greenfedora-utils');
const TemplateFile = require('../file/templateFile');
const debug = require("debug")("GreenFedora:TemplateProcessorMarkdown");
const debugdev = require("debug")("Dev.GreenFedora:TemplateProcessorMarkdown");

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
        let data = tpl.getData();

        // Are we building separate RSS content?
        let rss = false;
        if (data.buildSeparateRssContent) {
            rss = true;
            tpl.extracted['content_rss'] = tpl.extracted['content'];
            this.options.compileFields.push('content_rss');
        }

        // Preprocessing.
        if (this.preprocessors.length > 0) {
            for (let pp of this.preprocessors) {
                tpl.extracted.content = pp.preprocessString(tpl.extracted.content, tpl.filePath);
                if (rss) {
                    tpl.extracted.content_rss = pp.preprocessString(tpl.extracted.content_rss, tpl.filePath, true);
                }
            }
        }

        // Compile the necessary fields.
        for (let f of this.options.compileFields) {
            if (f.startsWith('data.') && data[f]) {
                tpl.templateData.frontMatterData[f] = this.engine.makeHtml(data[f]);
            } else if (tpl.extracted[f]) {
                tpl.extracted[f] = this.engine.makeHtml(tpl.extracted[f]);
            } else {
                debug(`No '${f}' field found in data or extracts for ${tpl.relPath}`);
            }
        }        

        let eng = this.config.getTemplateProcessor('nunjucks');

        let fnReady = async function (data) {
            return eng.renderString(tpl.extracted.content, data);
        };

        let ltpName = this.options.layoutTemplateProcessor;
        let ltp = this.config.getTemplateProcessor(ltpName);

        return ltp.compile(tpl.layout, fnReady);

    }

}

module.exports = TemplateProcessorMarkdown;