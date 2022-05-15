/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const TemplateProcessor = require('./templateProcessor');
const nunjucks = require('nunjucks');
const GfError = require('../../utils/gfError');
const TemplateFile = require('../file/templateFile');
const { syslog } = require('../../utils/logger');
const debug = require("debug")("GreenFedora:TemplateProcessorNunjucks");

// Local error.
class GfTemplateProcessorNunjucksError extends GfError {};

/**
 * Template processing for nunjucks.
 */
class TemplateProcessorNunjucks extends TemplateProcessor
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

        let loader;
        try {
            loader = new nunjucks.FileSystemLoader(options.paths);
        } catch (err) {
            throw new GfTemplateProcessorNunjucksError(`Unable to create nunjucks filesystem loader`, null, err);
        }

        try {
            this.engine = new nunjucks.Environment(loader, engineOptions);
        } catch (err) {
            throw new GfTemplateProcessorNunjucksError(`Unable to load nunjucks engine`, null, err);
        }

        debug(`Loaded nunjucks template processor.`)
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
    async compile(tpl)
    {
        // Sanity check.
        if (!tpl instanceof TemplateFile) {
            throw new GfTemplateProcessorNunjucksError(`Template files should be an instance of 'TemplateBase'.`);
        }

        // Compile.
        let compiled;
        if (this.options.usePrecompiledTemplates) {
            debug(`Retrieving precompiled nunjucks.Template for %s.`, tpl.filePath);
            compiled = this.getTemplate(tpl.fileName);
        } else if (this.needsCompliation(tpl.extracted.content)) {
            debug(`Creating nunjucks.Template for %s.`, tpl.filePath);
            compiled = new nunjucks.Template(tpl.extracted.content, this.engine, tpl.filePath, true);
        }

        // Return a function that will eventually render the template.
        return async function (data) {
            return new Promise(function (resolve, reject) {
                compiled.render(data, function (err, res) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
            });
        };
    }
}

module.exports = TemplateProcessorNunjucks;