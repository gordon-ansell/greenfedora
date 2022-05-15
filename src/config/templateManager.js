/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const ResourceManager = require('./resourceManager');
const TemplateProcessorMarkdown = require('../template/processors/templateProcessorMarkdown');
const TemplateProcessorNunjucks = require('../template/processors/templateProcessorNunjucks');
const debug = require("debug")("GreenFedora:TemplateManager");

/**
 * Template manager.
 */
class TemplateManager extends ResourceManager
{

    /**
     * Constructor.
     * 
     * @param   {Config}            config      Config parent.
     * 
     * @return  {TemplateManager}
     */
    constructor(config = null)
    {
        super('template', config);
    }

    /**
     * Add the default template processors.
     * 
     * @return  {TemplateManager}
     */
    addDefaultProcessors()
    {
        let cfg = this.config.getBaseConfig().defaultTemplateProcessors.markdown;

        // Markdown.
        this.addProcessor(
            'markdown', 
            new TemplateProcessorMarkdown(this.config, cfg.options, cfg.engineOptions),
            cfg.exts
        );

        cfg = this.config.getBaseConfig().defaultTemplateProcessors.nunjucks;

        // Nunjucks.
        cfg.options.paths = [
            this.config.getBaseConfig().locations.layouts,
            this.config.sitePath
        ];
        this.addProcessor(
            'nunjucks', 
            new TemplateProcessorNunjucks(this.config, cfg.options, cfg.engineOptions),
            cfg.exts
        );
    }

}

module.exports = TemplateManager;