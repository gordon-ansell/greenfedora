/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const fsPromises = require('fs').promises;
const path = require('path');
const GfError = require('../../utils/gfError');
const TemplateData = require('./templateData');
const { syslog } = require('../../utils/logger');
const fs = require('fs');
const fmparse = require('gray-matter');
const GfPath = require('../../utils/gfPath');
const debug = require("debug")("GreenFedora:TemplateFile");

// Local error.
class GfTemplateFileError extends GfError {};

/**
 * Template file.
 */
class TemplateFile
{
    /**
     * Path to the template file (absolute).
     * @member  {string}
     */
    filePath = null;

    /**
     * Relative path to the template file.
     * @member  {string}
     */
    relPath = null;

    /**
     * File name (without _layouts on the front).
     * @member  {string} 
     */
    fileName = null;

    /**
     * Configs.
     * @member  {Config}
     */
    config = null;

    /**
     * Extracted front matter.
     * @member  {object}
     */
    frontMatter = null;

    /**
     * File name parts.
     * @member {object}
     */
    fnParts = {
        dir: null,
        base: null,
        ext: null
    }

    /**
     * Template data.
     * @member  {TemplateData}
     */
    templateData = null;

    /**
     * Layout.
     * @member  {TemplateFile}
     */
    layout = null;

    /**
     * Fields extracted.
     * @member  {object}
     */
    extracted = {};

    /**
     * Renderer.
     * @member  {function}
     */
    renderer = null;

    /**
     * Constructor.
     * 
     * @param   {string}    filePath    Path to the file.
     * @param   {Config}    config      Config class instance.
     * 
     * @return  {TemplateFile}
     */
    constructor(filePath, config)
    {
        if (!filePath.startsWith(config.sitePath)) {
            filePath = path.join(config.sitePath, filePath);
        }
        this.filePath = filePath;
        this.relPath = filePath.replace(config.sitePath, '');

        this.fileName = GfPath.removeLeadingSlash(this.relPath.replace('_layouts', ''));

        this.config = config;

        this.fnParts.dir = path.dirname(this.relPath);
        this.fnParts.ext = path.extname(this.relPath);
        this.fnParts.base = path.basename(this.relPath, this.fnParts.ext);
        this.templateData = new TemplateData(filePath, config);
    }

    /**
     * Get the data for rendering.
     * 
     * @return {object}
     */
    renderData()
    {
        let ret = this.templateData.mergeData();
        for (let k in this.extracted) {
            ret[k] = this.extracted[k];
        }
        return ret;
    }

    /**
     * Load the file.
     * 
     * @return  {Promise<boolean>}
     */
    async load()
    {
        // Read the template.
        await this.read();

        // Merge the data before any layout work.
        let dataSoFar = this.templateData.mergeData();

        // Do we have a layout? If so, load it now.
        if (dataSoFar.layout) {
            // Read the template's layout.
            await this.getLayout().load();
            // Save the layout data as part of the data cascade.
            this.templateData.layoutData = this.layout.frontMatter.data;
        } else {
            debug(`Template file ${this.relPath} has no layout specified.`);
        }

        return true;
    }

    /**
     * Locate a layout.
     * 
     * @param   {string}        layout      Name to locate.
     * 
     * @return  {string|null}  
     */
    _locateLayout(layout)
    {
        if (!layout.endsWith('.njk')) {
            layout += '.njk';
        }
        let loc = this.config.getBaseConfig().locations.layouts;
        let full = path.join(this.config.sitePath, loc, layout);
        if (fs.existsSync(full)) {
            return full;
        }
        return null;
    }

    /**
     * Get the layout.
     * 
     * @return  {TemplateFile}
     */
    getLayout()
    {
        if (null === this.layout) {
            let dataSoFar = this.templateData.mergeData();
            if (dataSoFar.layout) {
                let layoutPath = this._locateLayout(dataSoFar.layout);
                if (null === layoutPath) {
                    throw new GfTemplateFileError(`Unable to locate layout for '${dataSoFar.layout}', processing ${this.relPath}.`);
                }
                this.layout = new TemplateFile(layoutPath, this.config);
            } else {
                throw new GfTemplateFileError(`No layout specified in ${this.relPath}.`);
            }
        }
        return this.layout;
    }

    /**
     * Read the template file.
     * 
     * @return  {Promise<TemplateFile>}
     * 
     * @throws  {GfTemplateError}       On error.
     */
    async read()
    {
        let tec = this.config.getTemplateProcessorForFile(this.filePath);
 
        if (!'options' in tec) {
            syslog.inspect(tec, "Template Config");
            throw new GfTemplateFileError(`No template user 'options' found in template engine config for: ${this.relPath}`);
        }
        let userOptions = tec.options;
        let extractions = userOptions.extractFromFm || [];

        this.frontMatter = await this._extractFrontMatter();

        if (0 === extractions.length || !extractions.includes('content')) {
            extractions.push('content');
        }

        // Extract fields as necessary.
        if (extractions) {
            for (let item of extractions) {
                if (this.frontMatter[item]) {
                    this.extracted[item] = this.frontMatter[item];
                } else if (this.frontMatter.data[item]) {
                    this.extracted[item] = this.frontMatter.data[item];
                    delete this.frontMatter.data[item];
                }
            }
        }

        // Save the front matter data.
        this.templateData.frontMatterData = this.frontMatter.data;

        return this;
    }

    /**
     * ===================================================
     * BASE
     * ===================================================
     */

    /**
     * Extract the front matter.
     * 
     * @return  {Promise<object>}
     */
    async _extractFrontMatter()
    {
        let raw = await this._readInputFile();
        let tec = this.config.getTemplateProcessorForFile(this.filePath);
        if (!tec.options) {
            throw new GfTemplateFileError(`No template user 'options' found in template engine config for: ${this.relPath}`);
        }
        let userOptions = tec.options;

        let ret;

        if (raw) {
                    
            if (userOptions.parseFrontMatter) {
                let fm;
                try {
                    fm = fmparse(raw, userOptions.fmParseOptions || {});
                } catch (err) {
                    throw new GfTemplateFileError(`Unable to parse front matter in ${this.relPath}.`, null, err);
                }

                if (fm.data.excerpt && !fm.excerpt) {
                    fm.excerpt = fm.data.excerpt;
                    delete fm.data.excerpt;
                }

                ret = fm;
            } else {
                ret = {data: {}, content: raw, excerpt: ""};
            }
        } else {
            ret = {data: {}, content: "", excerpt: ""};
        }

        debug(`Front matter for '${this.relPath}: %o`, ret);

        return ret;
    }

    /**
     * Read the input file.
     * 
     * @return  {Promise<string>}
     * 
     * @throws  {GfTemplateError}       On error.
     */
    async _readInputFile()
    {
        let content;
        try {
            content = await fsPromises.readFile(this.filePath, "utf8");
        } catch (err) {
            throw new GfTemplateFileError(`Unable to read template file: ${this.relPath}.`, null, err);
        }
        return content;
    }

    dump()
    {
        let k = Object.keys(this);
        let ret = {};
        for (let d of k) {
            if ('layout' === d && null !== this[d]) {
                ret[d] = this[d].dump();
            } else if ('config' !== d && 'templateData' !== d) {
                ret[d] = this[d];
            }
        }
        return ret;
    }
}

module.exports = TemplateFile;