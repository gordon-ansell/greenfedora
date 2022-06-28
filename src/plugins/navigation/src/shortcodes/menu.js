/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require("greenfedora-utils");
const MenuBase = require('../menuBase');
const debug = require("debug")("GreenFedora:Plugin:MenuShortcode");
const debugdev = require("debug")("Dev.GreenFedora:Plugin:MenuShortcode");

// Local error.
class GfMenuShortcodeError extends GfError {}

/**
 * Menu shortcode class.
 */
class MenuShortcode extends MenuBase
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

        if (!this.config.hasGlobalData('menus')) {
            throw new GfMenuShortcodeError(`No 'menus' saved in global data. Cannot render menu shortcode.`);
        }

        let menuData = this.config.getGlobalData('menus');

        if (!menuData[menu]) {
            throw new GfMenuShortcodeError(`No menu specs for menu '${menu}' found. Cannot render menu shortcode.`);
        }

        let d = menuData[menu];
        let struct = this.structureise(d);

        let ret = '';

        // Display the menu, beginning with the main structure.
        try {
            for (let item of struct['_main']) {

                item = this.sanitizeItem(item);

                ret += `<li><a href="${item.data.url}" title="${item.data.description}">${item.data.title}</a></li>\n`;

                // Substructure?
                if (struct[item.data.title]) {
                    debug(`Processing subsitems for ${item.data.title}`);
                    ret += `<li><ul class="menu-subitems">`;
                    for (let subitem of struct[item.data.title]) {
                        subitem = this.sanitizeItem(subitem);
                        debug(`Processing subitem ${subitem.data.title} with URL ${subitem.data.url}`);
                        ret += `<li class="subitem"><a class="link" href="${subitem.data.url}" title="${subitem.data.description}">
                            ${subitem.data.title}
                        </a></li>`
                    }
                    ret += `</ul></li>`;
                }
            }
        } catch (err) {
            throw new GfMenuShortcodeError(`Error in 'menu' shortcode looping struct: ${err.message}`, null, err);
        }

        return ret;

    }
}

module.exports = MenuShortcode;
