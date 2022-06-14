/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const ResourceManager = require('./resourceManager');
const TemplateProcessorMarkdown = require('../template/processors/templateProcessorMarkdown');
const TemplateProcessorMarkdoc = require('../template/processors/templateProcessorMarkdoc');
const TemplateProcessorNunjucks = require('../template/processors/templateProcessorNunjucks');

const absoluteUrl = require('../template/filters/absoluteUrl');
const htmlAbsUrl = require('../template/filters/htmlAbsUrl');
const slugify = require('../template/filters/slugify');
const url = require('../template/filters/url');
const displayDate = require('../template/filters/displayDate');
const displayTime = require('../template/filters/displayTime');
const datePart = require('../template/filters/datePart');
const isoDateTime = require('../template/filters/isoDateTime');
const utcDateTime = require('../template/filters/utcDateTime');

const SimpleImg = require('../template/shortcodes/simpleImg');
const Img = require('../template/shortcodes/img');
const Schema = require('../template/shortcodes/schema');
const VideoLink = require('../template/shortcodes/videolink');
const Citations = require('../template/shortcodes/citations');
const Breadcrumb = require('../template/shortcodes/breadcrumb');
const HowTo = require('../template/shortcodes/howto');
const HowToStep = require('../template/shortcodes/howtostep');

const PreprocessorImage = require('../template/preprocessors/preprocessorImage');
const PreprocessorComment = require('../template/preprocessors/preprocessorComment');
const PreprocessorDelimiter = require('../template/preprocessors/preprocessorDelimiter');
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
        let cfg; 

        if (this.config.getBaseConfig().useMarkdoc) {

            cfg = this.config.getBaseConfig().defaultTemplateProcessors.markdoc;

            // Markdoc.
            this.addProcessor(
                'markdoc', 
                new TemplateProcessorMarkdoc(this.config, cfg.options, cfg.engineOptions),
                cfg.exts
            );

        } else {

            cfg = this.config.getBaseConfig().defaultTemplateProcessors.markdown;

            // Markdown.
            this.addProcessor(
                'markdown', 
                new TemplateProcessorMarkdown(this.config, cfg.options, cfg.engineOptions),
                cfg.exts
            );
        }

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

    /**
     * Add the default template processor mods.
     * 
     * @return  {TemplateManager}
     */
    addDefaultProcessorMods()
    {
        this.getProcessor('nunjucks')
            .addFilter('absoluteUrl', absoluteUrl)
            .addFilter('htmlAbsUrl', htmlAbsUrl)
            .addFilter('slugify', slugify)
            .addFilter('url', url)
            .addFilter('datePart', datePart)
            .addFilter('displayDate', displayDate)
            .addFilter('displayTime', displayTime)
            .addFilter('isoDateTime', isoDateTime)
            .addFilter('utcDateTime', utcDateTime)

        this.getProcessor('nunjucks')
            .addShortcode('simpleimg', SimpleImg)
            .addShortcode('img', Img)
            .addShortcode('videolink', VideoLink)
            .addShortcode('schema', Schema)
            .addShortcode('citations', Citations)
            .addShortcode('breadcrumb', Breadcrumb)
            .addPairedShortcode('howto', HowTo)
            .addPairedShortcode('howtostep', HowToStep);

        this.getProcessor('markdown')
            .addPreprocessor(new PreprocessorImage(this.config))
            .addPreprocessor(new PreprocessorComment(this.config))
            .addPreprocessor(new PreprocessorDelimiter(this.config));
    }
}

module.exports = TemplateManager;