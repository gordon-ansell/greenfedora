/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfError, GfPath } = require("greenfedora-utils");
const MenuBase = require('../menuBase');
const path = require('path');
const debug = require("debug")("GreenFedora:Plugin:MenuSeqShortcode");
const debugdev = require("debug")("Dev.GreenFedora:Plugin:MenuSeqShortcode");

// Local error.
class GfMenuSeqShortcodeError extends GfError {}

/**
 * Menu seq shortcode class.
 */
class MenuSeqShortcode extends MenuBase
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
        let menu = args[0];
        let dir = args[1] || null;

        if (null === dir) {
            throw new GfMenuSeqShortcodeError(`No direction ('dir') passed to 'menuseq' shortcode.`)
        }

        if ('prev' !== dir && 'next' !== dir) {
            throw new GfMenuSeqShortcodeError(`Direction '${dir}' is invalid for 'menuseq' shortcode. Must be 'orev' or 'next'.`);
        }

        if (!this.config.hasGlobalData('menus')) {
            throw new GfMenuSeqShortcodeError(`No 'menus' saved in global data. Cannot render menusubs shortcode.`);
        }

        let menuData = this.config.getGlobalData('menus');

        if (!menuData[menu]) {
            throw new GfMenuSeqShortcodeError(`No menu specs for menu '${menu}' found. Cannot render menusubs shortcode.`);
        }

        let ourTitle;
        let ourUrl;

        let nav = this.getRelevantNav(context.ctx, menu);

        if (nav && nav.title) {
            ourTitle = nav.title;
        } else if (context.ctx.title) {
            ourTitle = context.ctx.title;
        }

        if (nav && nav.url) {
            ourUrl = nav.url;
        } else if (context.ctx.permalink) {
            ourUrl = context.ctx.permalink;
        }

        if (!ourTitle) {
            throw new GfMenuSeqShortcodeError(`The 'menuseq' shortcode cannot establish the current title.`);
        }

        if (!ourUrl) {
            throw new GfMenuSeqShortcodeError(`The 'menuseq' shortcode cannot establish the current URL (permalink).`);
        }

        let d = menuData[menu];
        let struct = this.structureise(d, true);


        let count = 0;
        for (let item of struct) {
            if (ourTitle === item.data.title && ourUrl === item.data.url) {

                if ('prev' === dir) {
                    if (count > 0) {
                        return `<a href="${struct[count - 1].data.url}">&larr; ${struct[count - 1].data.title}</a>`;
                    } else {
                        return `&nbsp;`;
                    }
                } else if ('next' === dir) {
                    if (count < struct.length - 1) {
                        return `<a href="${struct[count + 1].data.url}">${struct[count + 1].data.title} &rarr;</a>`;
                    } else {
                        return `&nbsp;`;
                    }
                }

            }
            count++;
        }

        return '';

    }
}

module.exports = MenuSeqShortcode;
