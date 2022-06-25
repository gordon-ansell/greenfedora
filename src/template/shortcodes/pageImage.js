/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog } = require("greenfedora-utils");

/**
 * PageImage shortcode class.
 */
class PageImageShortcode extends NunjucksShortcode
{
    /**
     * Render.
     * 
     * @param   {object}    context     URL.
     * @param   {Array}     args        Other arguments.
     * 
     * @return  {string}
     */
    render(context, args)
    {
        //syslog.warning(`Calling pageImage for ${context.ctx.relPath}`)
        let page = context.ctx.relPath;

        let siteDefImage = (context.ctx.site && context.ctx.site.defaultArticleImage) ? context.ctx.site.defaultArticleImage : 'NODEFAULT';

        let type = args[0] || 'jpeg';
        let size = args[1] || 1280;
        let def = args[3] || siteDefImage;

        return this.config.imageInfoStore.getSpecificUrlByPage(page, type, size, def);

        //return 'hello';

    }
}

module.exports = PageImageShortcode;
