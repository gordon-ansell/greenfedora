/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, GfPath, GfError } = require("greenfedora-utils");

// Local error.
class GfMenuBaseError extends GfError {}

/**
 * Menu base class.
 */
class MenuBase extends NunjucksShortcode
{ 
    /**
     * Structurise a menu.
     * 
     * @param   {object}    menu        Menu to structureise.
     * @param   {boolean}   flatten     Flatten the structure?
     * 
     * @return  {object}
     */
    structureise(menu, flatten = false)
    {
        menu.sort( (a, b) => {
            return (a.data.pos > b.data.pos) ? 1 : ((b.data.pos > a.data.pos) ? -1 : 0)
        });

        // See if we have parent fields. If so, store in a structured manner.
        let struct = {};
        for (let item of menu) {
            if (item.data.parent) {
                if (!struct[item.data.parent]) {
                    struct[item.data.parent] = []
                }
                struct[item.data.parent].push(item);
            } else {
                if (!struct['_main']) {
                    struct['_main'] = [];
                }
                struct['_main'].push(item);
            }
        }

        // Sort each part of the structure.
        for (let level in struct) {
            struct[level].sort( (a, b) => {
                return (a.data.pos > b.data.pos) ? 1 : ((b.data.pos > a.data.pos) ? -1 : 0)
            });
        }

        if (flatten) {
            let ret = [];
            let count = 0;
            for (let item of struct['_main']) {
                item.data.structPos = count;
                count++;
                ret.push(item);
                if (struct[item.data.title]) {
                    for (let sub of struct[item.data.title]) {
                        sub.data.structPos = count;
                        count++;
                        ret.push(sub);
                    }
                }
            }
            return ret;
        }

        return struct;
    }

    /**
     * Sanitize an item.
     * 
     * @param   {object}    item    Item to sanitize.
     * 
     * @return  {object}
     */
    sanitizeItem(item) 
    {
        let tplData = item.tpl.getData();

        if (!item.data.title && tplData.title) {
            item.data.title = tplData.title;    
        }

        if (!item.data.description && tplData.description) {
            item.data.description = tplData.description;    
        }

        if (!item.data.url && tplData.permalink) {
            item.data.url = tplData.permalink;    
        }

        item.data.url = GfPath.addBothSlashes(item.data.url);

        return item;
    }

    /**
     * Get the relevant navigation structure.
     * 
     * @param   {object}    tplData     Template data.
     * @param   {string}    menuName    Menu name.
     */
    getRelevantNav(tplData, menuName)
    {
        let nav;
        if (tplData.navigation) {
            if (Array.isArray(tplData.navigation)) {
                for (let item of tplData.navigation) {
                    if (item.menu === menuName) {
                        nav = item;
                        break;
                    }
                }
            } else if (tplData.navigation.menu === menuName) {
                nav = tplData.navigation;
            } else {
                throw new GfMenuBaseError(`Could not find 'navigation' structure for one of the menu shortcodes, ${tplData.relPath}`);
            }
        }

        return nav;
    }
}

module.exports = MenuBase;
