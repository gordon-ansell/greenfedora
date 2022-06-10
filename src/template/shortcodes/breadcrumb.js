/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, NunjucksShortcode, GfError, GfPath } = require("greenfedora-utils");

class GfBreadcrumbShortcodeError extends GfError {};

/**
 * Breadcrumb shortcode class.
 */
class BreadcrumbShortcode extends NunjucksShortcode
{
    /**
     * Static location translator.
     * 
     * @param   {string}    loc     Location to parse.
     * @param   {object}    ctx     Contest.
     * 
     * @return  {object}        
     */
    static locationParse(loc, ctx) 
    {
        if ("home" === loc) {
            return {
                title: "Home",
                url: "/"
            }
        } else if ("tags" === loc) {
            return {
                title: "Tags",
                url: "/tags/"
            }
        } else if ("self" === loc) {
            return {
                title: ctx.title,
                url: GfPath.addBothSlashes(ctx.permalink)
            }
        }

        throw new GfBreadcrumbShortcodeError(`Invalid breadcrumb location: '${loc}'`);
    }

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
        if (!context.ctx.breadcrumb) {
            return '';
        }

        let brc = context.ctx.breadcrumb;
        let ret = '';
        let rarr = "&#8594;";

        let count = 0;
        for (let item of brc) {
            if ('' !== ret) {
                ret += ' ' + rarr + ' ';
            }
            let data;
            if (item.loc) {
                data = BreadcrumbShortcode.locationParse(item.loc, context.ctx);
            } else {
                data = item;
            }

            if (count < brc.length - 1) {
                ret += `<a href=${data.url}>${data.title}</a>`;
            } else {
                ret += data.title;
            }
            count++;
        }

        return ret;

    }
}

module.exports = BreadcrumbShortcode;
