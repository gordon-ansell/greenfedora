/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const Markdoc = require('@markdoc/markdoc');
const { GfError, syslog, TemplateProcessor } = require('greenfedora-utils');
const TemplateFile = require('../file/templateFile');
const debug = require("debug")("GreenFedora:TemplateProcessorMarkdoc");

// Local error.
class GfTemplateProcessorMarkdocError extends GfError {};

/**
 * Template processing for markdoc.
 */
class TemplateProcessorMarkdoc extends TemplateProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Configs.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {TemplateProcessorMarkdoc}
     * 
     * @throws  {GfTemplateProcessorMarkdoc}  On error.
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);

        this.engine = Markdoc;

        /*
        try {
            this.engine = new showdown.Converter(this.engineOptions);
        } catch (err) {
            throw new GfTemplateProcessorMarkdownError(`Unable to create markdown engine`, null, err);
        }
        */

        debug(`Loaded markdoc template processor.`);
    }

    /**
     * Compile a string.
     * 
     * @param   {TemplateFile}      tpl         Template file to process.
     * 
     * @return  {Promise<function>}
     * 
     * @throws  {GfTemplateProcessorMarkdocError}  On error.
     */
    async compile(tpl)
    {
        // Sanity check.
        if (!tpl instanceof TemplateFile) {
            throw new GfTemplateProcessorMarkdocError(`Template files should be an instance of 'TemplateFile'. Processing ${tpl.relPath}.`);
        }

        // Get the template data.
        let data = tpl.getData();

        for (let f of this.options.compileFields) {
            if (f.startsWith('data.') && data[f]) {
                tpl.templateData.frontMatterData[f] = this._compile(data[f], data);
            } else if (tpl.extracted[f]) {
                tpl.extracted[f] = this._compile(tpl.extracted[f], data);
            } else {
                debug(`No '${f}' field found in data or extracts for ${tpl.relPath}`);
            }
        }

        let ltpName = this.options.layoutTemplateProcessor;
        let ltp = this.config.getTemplateProcessor(ltpName);

        //syslog.inspect(tpl.dump());

        return ltp.compile(tpl.layout);
    }

    /**
     * Compile the markdoc.
     *
     * @param   {object}    string      Input string.
     * @param   {object}    data        Input data.
     *
     * @return  {string}                
     */
    _compile(str, data = {})
    {
        let ast; 
        try {
            ast = this._parse(str);
        } catch (err) {
            throw new GfTemplateProcessorMarkdocError(`Error parsing Markdoc.`, null, err);
        }

        let markdocConfig = {
            variables: data
        }
        let content;
        try {
            content = this._transform(ast, markdocConfig);
        } catch (err) {
            throw new GfTemplateProcessorMarkdocError(`Error transforming Markdoc.`, null, err);
        }

        let rendered;
        try {
            rendered = this._renderers(content);
        } catch (err) {
            throw new GfTemplateProcessorMarkdocError(`Error rendering Markdoc.`, null, err);
        }
        
        return rendered;
    }

    /**
     * Parse the markdoc.
     *
     * @param   {string}  str  Input string.
     *
     * @return  {object}       Abstact syntax tree (AST)
     */
    _parse(str)
    {
        return this.engine.parse(str);
    }

    /**
     * Transform the markdoc AST.
     *
     * @param   {object}    ast     Input AST.
     * @param   {object}    data    Input data in Markdoc config format.
     *
     * @return  {string}            Transformed AST.    
     */
    _transform(ast, data = {})
    {
        return this.engine.transform(ast, data);
    }

    /**
     * Render the markdoc.
     *
     * @param   {string}  str  Input string.
     *
     * @return  {string}     
     */
    _renderers(str)
    {
        return this.engine.renderers.html(str);
    }

}

module.exports = TemplateProcessorMarkdoc;