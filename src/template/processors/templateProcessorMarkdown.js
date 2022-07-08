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
const st = require('striptags');
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
                try {
                    /*
                    if (Array.isArray(tpl.extracted[f])) {
                        syslog.notice(`Leader is list for ${tpl.relPath}`)
                        let tmp = '<ul>\n';
                        for (let item of tpl.extracted[f]) {
                            tmp += `<li>${item}</li>\n`;
                        }
                        tmp += '</ul>\n';
                        tpl.extracted[f] = tmp;
                    } else {
                        */
                        tpl.extracted[f] = this.engine.makeHtml(tpl.extracted[f]);
                    //}
                } catch (err) {
                    throw new GfTemplateProcessorMarkdownError(`Unable to makeHtml on extracted field '${f}' in ${tpl.relPath}`);
                }
            } else {
                debug(`No '${f}' field found in data or extracts for ${tpl.relPath}`);
            }
        }        

        if (tpl.extracted.content_rss) {
            syslog.info(`${tpl.relPath} OK`)
        } else {
            syslog.warn(`${tpl.relPath} NOT OK`)
        }

        let eng = this.config.getTemplateProcessor(this.options.preCompileTemplateProcessor);

        let compileFields = this.options.compileFields;
        let needsCompilation = this.needsCompliation;
        let etags = {};
        if (this.engine.options && this.engine.options.tags) {
            etags = this.engine.options.tags;
        }

        let ppp = this.config.getTemplateProcessor(this.options.preCompileTemplateProcessor).postprocessors;

        let fnPost = async function(str) {
            if (ppp.length > 0) {
                for (let pp of ppp) {
                    str = pp.postprocessString(str);
                }
            }
            return str;
        };


        let fnReady = async function (data) {
            let cf = {};
            for (let f of compileFields) {     
                if (tpl.extracted[f] && needsCompilation(tpl.extracted[f], etags)) {       
                    try {
                        cf[f] = eng.renderString(tpl.extracted[f], data, tpl.relPath + ' - ' + f);
                    } catch (err) {
                        syslog.inspect(tpl.extracted[f], 'Field to process for error that follows:');
                        throw new GfError(`Problem processing render's fnReady function through nunkucks for field '${f}', for file ${tpl.relPath}`, null, err);
                    }
                    tpl.extracted[f] = cf[f];
                }
            }
            return cf;
        };

        let ltpName = this.options.layoutTemplateProcessor;
        let ltp = this.config.getTemplateProcessor(ltpName);

        return ltp.compile(tpl.layout, fnReady, fnPost);

    }

    /**
     * Parse into html and text.
     * 
     * @param   {string}    str     String to parse.
     * @param   {object}    data    Data to use.
     * 
     * @return  {string[]}          [html, text]
     */
    parseMarkdown(str, data = {})
    {
        let eng = this.config.getTemplateProcessor(this.options.preCompileTemplateProcessor);
        let html = eng.renderString(str, data);
        html = this.engine.makeHtml(html);
        let text = st(html);
        if (-1 !== text.indexOf('<em>')) {
            syslog.error(`Striptags did not work correctly.`);
        }

        return [html, text];
    }
}

module.exports = TemplateProcessorMarkdown;