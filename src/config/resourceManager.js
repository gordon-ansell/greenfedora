/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require('greenfedora-utils');
const path = require('path');
const debug = require("debug")("GreenFedora:TemplateManager");

// Local exception.
class GfResourceManagerError extends GfError {};

/**
 * Resource manager.
 */
class ResourceManager
{
    /**
     * Resource type.
     * @member  {string}
     */
    type = null;

    /**
     * User config.
     * @member  {Config}
     */
    config = null;

    /**
     * Processors.
     * @member  {object}
     */
    processors = {};

    /**
     * Processor extensions.
     * @member  {object}
     */
    processorExts = {};

    /**
     * Constructor.
     * 
     * @param   {string}            type        Type.
     * @param   {Config}            config      Config parent.
     * 
     * @return  {ResourceManager}
     */
    constructor(type, config = null)
    {
        this.type = type;
        this.config = config;
    }

    /**
     * Add a template processor.
     * 
     * @param   {string}                name        Name of the template processor.
     * @param   {ResourceProcessor}     instance    Resource processor instance.
     * @param   {string|string[]}       exts        Extensions to handle.
     * 
     * @return  {ResourceManager}
     */
    addProcessor(name, instance, exts)
    {
        if (name in this.processors) {
            syslog.warning(`Overwriting existing ${this.type} processor for '${name}' with instance of '${instance.constructor.name}'`);
        }

        this.processors[name] = instance;

        if (!Array.isArray(exts)) {
            exts = [exts];
        }

        for (let ext of exts) {
            if (ext in this.processorExts) {
                syslog.warning(`Overwriting existing ${this.type} processor extension for '${ext}' with processor '${name}'`);
            }
            this.processorExts[ext] = name;
        }

        debug(`Added ${this.type} processor '%s' with instance of '%s', for extensions '%s'`,
            name, instance.constructor.name, exts.join(', '));

        return this;
    }

    /**
     * See if the passed extension is a resource with a handler.
     * 
     * @param   {string}    ext         Extension to check.
     * 
     * @return  {boolean}
     */
    isHandled(ext) 
    {
        if ('.' === ext.charAt(0)) {
            ext = ext.substring(1);
        }

        return (ext in this.processorExts);
    }

    /**
     * Get a processor.
     * 
     * @param   {string}    name        Name to get it for.
     * 
     * @return  {ResourceProcessor}
     * 
     * @throws  {GfResourceManagerError}         If no processor found.
     */
    getProcessor(name)
    {
        if (!name in this.processors) {
            throw new GfResourceManagerError(`No ${this.type} processor for '${name}' found.`);
        }
        return this.processors[name];
    }

    /**
     * Get the processor for a given extension.
     * 
     * @param   {string}    ext         Extension to get processor for.
     * 
     * @return  {ResourceProcessor}
     * 
     * @throws  {GfResourceManagerError}         If no processor found.
     */
    getProcessorForExt(ext)
    {
        if (this.isHandled(ext)) {
            return this.getProcessor(this.processorExts[ext]);
        } else {
            throw new GfTemplateManagerError(`Could not find a ${this.type} processor for extension: ${ext}.`);
        }
    }

    /**
     * Get the processor for a given file.
     * 
     * @param   {string}    filePath    File to get processor for.
     * 
     * @return  {ResourceProcessor}
     */
    getProcessorForFile(filePath)
    {
        let ext = path.extname(filePath).substring(1);
        return this.getProcessorForExt(ext);
    }

}

module.exports = ResourceManager;