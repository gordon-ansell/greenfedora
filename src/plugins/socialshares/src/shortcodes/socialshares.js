/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, GfError, syslog, GfString } = require('greenfedora-utils');
const { URL } = require('url');
const debug = require("debug")("GreenFedora:Plugin:SocialSharesShortcode");

class GfSocialSharesShortcodeError extends GfError {}


/**
 * Social shares shortcode class.
 */
class SocialSharesShortcode extends NunjucksShortcode
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
        let ctx = context.ctx;

        if (!ctx.socialShares) {
            throw new GfSocialSharesShortcodeError(`The social shares plugin requires a 'socialShares' definition in config.`);
        }

        let article = context.ctx;

        let ret = '';

        for (let item of ctx.socialShares.items) {
            if (!item.name) {
                throw new GfSocialSharesShortcodeError(`A social share requires a 'name' field.`);
            }
            if (!item.link) {
                throw new GfSocialSharesShortcodeError(`The ${item.name} social share requires a 'link' field.`);
            }

            let link = item.link;

            if (!article.title) {
                throw new GfSocialSharesShortcodeError(`The ${item.name} social share requires an article 'title' field.`);
            }

            if (link.includes('(((wstitle)))') && !article.site.title) {
                throw new GfSocialSharesShortcodeError(`The ${item.name} social share requires a 'site.title' field in the configs.`);
            }

            link = GfString.replaceAll(link, '(((url)))', (new URL(article.permalink, article.hostname)).toString());
            link = GfString.replaceAll(link, '(((title)))', article.title);
            link = GfString.replaceAll(link, '(((wstitle)))', article.site.title);
            link = GfString.replaceAll(link, '(((wsurl)))', article.hostname);

            ret += `<span class="socialshare socialshare-${GfString.slugify(item.name)}">`;

            if (item.icon) {
                ret += `<a href="${link}" title="Share via ${item.name}.">`;
                ret += `<img src="${item.icon}" alt="Icon for ${item.name}" class="fixed" />`;
                ret += `</a>`;
            } else {
                ret += `<a href="${link}" title="Share via ${item.name}.">${item.name}</a>`;
            }

            ret += '</span>';

        }

        return ret;

    }

}

module.exports = SocialSharesShortcode;
  