/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const nunjucks = require('nunjucks');
const { GfError, syslog, TemplateProcessor } = require('greenfedora-utils');
const TemplateFile = require('../file/templateFile');
const debug = require("debug")("GreenFedora:TemplateProcessorNunjucks");

// Local error.
class GfTemplateProcessorNunjucksError extends GfError {};

/**
 * Template processing for nunjucks.
 */
class TemplateProcessorNunjucks extends TemplateProcessor
{
    /**
     * Processor mods (filters, shortcodes etc.)
     * @member  {object}
     */
    mods = {
        filters: {},
        preProcessors: {},
        postProcessors: {},
    };

    /**
     * Precompiled templates.
     * @member  {object}
     */
    precompiledTemplates = {};

    /**
     * Are we using precompiled templates?
     * @member  {boolean}
     */
    usingPrecompiledTemplates = false;

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

        let loader;
        try {
            loader = new nunjucks.FileSystemLoader(options.paths);
        } catch (err) {
            throw new GfTemplateProcessorNunjucksError(`Unable to create nunjucks filesystem loader`, null, err);
        }

        if ('dev' === this.config.config.mode) {
            engineOptions.dev = true;
        }

        try {
            this.engine = new nunjucks.Environment(loader, engineOptions);
        } catch (err) {
            throw new GfTemplateProcessorNunjucksError(`Unable to load nunjucks engine`, null, err);
        }

        this.engine.addGlobal('ctx', function() { 
            return this.ctx;
        });

        debug(`Loaded nunjucks template processor.`)
    }

    /**
     * Add a global variable.
     * 
     * @param   {string}    name    Name of variable.
     * @param   {any}       val     Value of the global.
     * 
     * @return  {TemplateProcessorNunjucks}
     */
    addGlobal(name, val)
    {
        this.engine.addGlobal(name, val);
        return this;
    }

    /**
     * Get a global variable.
     * 
     * @param   {string}    name    Name of variable.
     * 
     * @return  {any}
     */
    getGlobal(name)
    {
        return this.engine.getGlobal(name);
    }

    /**
     * Add a filter.
     * 
     * @param   {string}                    name                Name.
     * @param   {function}                  func                Function to call.
     * @param   {boolean}                   [isAsync=false]     Well, is it?
     * 
     * @return  {TemplateProcessorNunjucks}
     */
    addFilter(name, func, isAsync = false)
    {
        this.engine.addFilter(name, func, isAsync);
        return this;
    }

    /**
     * Add a shortcode.
     * 
     * @param   {string}                    name                Name.
     * @param   {function}                  func                Function to call.
     * @param   {boolean}                   [isAsync=false]     Well, is it?
     * 
     * @return  {TemplateProcessorNunjucks}
     */
    addShortcode(name, func, isAsync = false)
    {
        this.engine.addExtension(name, new func(name, this.config, false, isAsync));
        return this;
    }

    /**
     * Add a paired shortcode.
     * 
     * @param   {string}                    name                Name.
     * @param   {function}                  func                Function to call.
     * @param   {boolean}                   [isAsync=false]     Well, is it?
     * 
     * @return  {TemplateProcessorNunjucks}
     */
    addPairedShortcode(name, func, isAsync = false)
    {
        this.engine.addExtension(name, new func(name, this.config, true, isAsync));
        return this;
    }

    /**
     * Get a template.
     * 
     * @param   {string}    name                    Template name.
     * @param   {boolean}   [eagerCompile=true]     Compile now?
     * 
     * @return  {string}
     */
    getTemplate(name, eagerCompile = true)
    {
        return this.engine.getTemplate(name, eagerCompile);
    }

    /**
     * Compile a file.
     * 
     * @param   {TemplateFile}      tpl                 Template file.
     * 
     * @return  {Promise<function>}
     */
    async compile(tpl, fnReady, fnPost)
    {
        // Sanity check.
        if (!(tpl instanceof TemplateFile)) {
            throw new GfTemplateProcessorNunjucksError(`Template files should be an instance of 'TemplateFile'.`);
        }

        // Compile.
        let compiled;
        if (this.options.usePrecompiledTemplates) {
            debug(`Retrieving precompiled nunjucks.Template for %s.`, tpl.filePath);
            compiled = this.getTemplate(tpl.fileName);
        } else if (this.needsCompliation(tpl.templateData.content)) {
            debug(`Creating nunjucks.Template for %s.`, tpl.filePath);
            compiled = new nunjucks.Template(tpl.templateData.content, this.engine, tpl.filePath, true);
        }

        // Layout?
        if (tpl.layout) {
            let ltpName = this.options.layoutTemplateProcessor;
            let ltp = this.config.getTemplateProcessor(ltpName);

            return ltp.compile(tpl.layout, fnReady, fnPost);
        }

        // We'll always need this in the data.
        let colls = this.config.collections;

        // Prepare a function that will eventually render the template.
        return async function (data) {
            if ("function" === typeof fnReady) {
                let cf = await fnReady(data);
                for (let key in cf) {
                    data[key] = cf[key];
                }
                data.collections = colls;
            } 
            return new Promise(function (resolve, reject) {
                compiled.render(data, function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        if (fnPost) {
                            resolve(fnPost(res));
                        } else {
                            resolve(res);
                        }
                    }
                });
            });
        };

    }

    /**
     * Render a string.
     * 
     * @param   {string}    str         String to render.
     * @param   {object}    [data={}]   Data to use.
     * 
     * @return  {string}
     * 
     * @throws  {GfTemplateProcessorNunjucksError}
     */
    renderString(str, data = {}, hint = 'unknown')
    {
        let ret;
        try {
            ret = this.engine.renderString(str, data);
        } catch (err) {
            //syslog.inspect(str);
            throw new GfTemplateProcessorNunjucksError(`Unable to render string: ${err.message}, processing ${hint}` +
                this._getUsefulErrDetails(err.message), null, err);           
        }

        /*
        if (this.postprocessors.length > 0) {
            for (let pp of this.postprocessors) {
                ret = pp.postprocessString(ret, hint);
            }
        }
        */
        return ret;
    }

    /**
     * Get the useful information from an error.
     * 
     * @param   {string}    errMessage      Error message.
     * @return  {string}                    Useful stuff.
     */
    _getUsefulErrDetails(errMessage)
    {
        let ret = [];
        let lines = errMessage.split('\n');

        for (let line of lines) {
            if (line.includes('(unknown path)')) {
                continue;
            }
            ret.push(line);
        }

        if (ret.length == 0) {
            ret.push("No error information present.");
        }

        if (errMessage.includes("attempted to output null or undefined value")) {
            ret.push("\t==> This will most likely be a logic error in your template.");
            ret.push("\t==> Check everything between the '{' and '}' characters and the odds are you'll find something wrong.");
            ret.push("\t==> A mistyped variable name or spurious '%' are good candidates.");
        }

        return ret.join('\n');
    }
}

module.exports = TemplateProcessorNunjucks;