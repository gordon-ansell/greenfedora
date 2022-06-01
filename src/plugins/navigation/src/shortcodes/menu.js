/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, GfError, GfPath } = require("greenfedora-utils");
const path = require('path');
const debug = require("debug")("GreenFedora:Plugin:MenuShortcode");
const debugdev = require("debug")("Dev.GreenFedora:Plugin:MenuShortcode");

// Local error.
class GfMenuShortcodeError extends GfError {}

/**
 * Menu shortcode class.
 */
class MenuShortcode extends NunjucksShortcode
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

        if (!this.config.hasGlobalData('navigation')) {
            throw new GfMenuShortcodeError(`No 'navigation' sabed in global data. Cannot render menu shortcode.`);
        }

        let menuData = this.config.getGlobalData('navigation');

        if (!menuData[menu]) {
            throw new GfMenuShortcodeError(`No navigation spects for menu '${menu}' found. Cannot render menu shortcode.`);
        }

        let d = menuData[menu];

        d.sort( (a, b) => {
            return (a.data.pos < b.data.pos) ? 1 : ((b.data.pos < a.data.pos) ? -1 : 0)
        });

        let ret = '';

        for (let item of d) {
            let title = 'undefined';
            let url = 'undefined';
            let tplData = item.tpl.getData();

            if (item.data.title) {
                title = item.data.title;
            } else if (tplData.title) {
                title = tplData.title;    
            }

            if (item.data.url) {
                url = item.data.url;
            } else if (tplData.permalink) {
                url = tplData.permalink;    
            }

            url = GfPath.addTrailingSlash(url);

            ret += `<li><a href="${url}">${title}</a></li>\n`;
        }

        return ret;

    }
}

module.exports = MenuShortcode;
