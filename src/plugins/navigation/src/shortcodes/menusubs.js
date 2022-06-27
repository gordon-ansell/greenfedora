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
const debug = require("debug")("GreenFedora:Plugin:MenuSubsShortcode");
const debugdev = require("debug")("Dev.GreenFedora:Plugin:MenuSubsShortcode");

// Local error.
class GfMenuSubsShortcodeError extends GfError {}

/**
 * Menu subs shortcode class.
 */
class MenuSubsShortcode extends MenuBase
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
        let subsof = args[1] || null;

        if (null === subsof) {
            let nav = this.getRelevantNav(context.ctx, menu);
            if (nav && nav.title) {
                subsof = nav.title;
            } else if (context.ctx.title) {
                subsof = context.ctx.title;
            }
        }

        if (!this.config.hasGlobalData('menus')) {
            throw new GfMenuSubsShortcodeError(`No 'menus' saved in global data. Cannot render menusubs shortcode.`);
        }

        let menuData = this.config.getGlobalData('menus');

        if (!menuData[menu]) {
            throw new GfMenuSubsShortcodeError(`No menu specs for menu '${menu}' found. Cannot render menusubs shortcode.`);
        }

        let d = menuData[menu];
        let struct = this.structureise(d);

        if (!struct[subsof]) {
            syslog.warning(`Menusubs shortcode could not find any subs for ${subsof}.`)
            return '';
        }

        let ret = '<ul class="nav-subs">';

        // Display the menu, beginning with the main structure.
        for (let item of struct[subsof]) {
            item = this.sanitizeItem(item);
            ret += `<li><a href="${item.data.url}" title="${item.data.description}">${item.data.title}</a></li>\n`;
        }

        ret += `</ul>`

        return ret;

    }
}

module.exports = MenuSubsShortcode;
