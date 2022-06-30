/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, NunjucksShortcode, GfError, GfPath, GfString } = require("greenfedora-utils");
const debug = require("debug")("GreenFedora:Plugin:BreadcrumbShortcode");

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
        } else if ("taggrab" === loc) {
            debug(`Doing tag grab for ${ctx.title}.`);
            let count = ctx.breadcrumbUsesTags;
            debug(`count is ${count}`);
            if (count < 1) count = 1;
            let articleTags = ctx.tags;
            if ("string" === typeof articleTags) {
                articleTags = articleTags.split(',');
            }
            debug(`articleTags: %O,`, articleTags);
            let ret = [];
            for (let i = 0; i < count; i++) {
                if (articleTags.length > i) {
                    let nr = {title: articleTags[i].trim(), url: "/tags/" + GfString.slugify(articleTags[i].trim()) + "/"};
                    debug(`Pushing %O`, nr);
                    ret.push(nr)
                }
            }
            return ret;
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

            debug(`Returned data is: %O`, data);

            if (Array.isArray(data)) {
                debug(`Data is an array.`);
                let tagRet = '';
                for (let singleTag of data) {
                    if ('' !== tagRet) {
                        tagRet += ' ' + rarr + ' ';
                    }
                    if (count < brc.length - 1) {
                        tagRet += `<a href=${singleTag.url}>${singleTag.title}</a>`;
                    } else {
                        tagRet += singleTag.title;
                    }
                }
                debug (`Adding %s to return`);
                ret += tagRet;
            } else {
                if (count < brc.length - 1) {
                    ret += `<a href=${data.url}>${data.title}</a>`;
                } else {
                    ret += data.title;
                }
            } 

            count++;
        }

        //syslog.inspect(ret);           
        return ret;

    }
}

module.exports = BreadcrumbShortcode;
