/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfError } = require('greenfedora-utils');
const Menu = require('./src/shortcodes/menu');
const MenuSubs = require('./src/shortcodes/menusubs');
const MenuSeq = require('./src/shortcodes/menuseq');
const debug = require('debug')('GreenFedora:Plugin:navigation');

class GfNavigationPluginError extends GfError {}''

/**
 * Grab navigation stuff after template processed.
 *
 * @param   {Config}        config  Configs
 * @param   {TemplateFile}  tpl     Template we're processing.
 *
 * @return  {void}
 */
function after_process_single_template(config, tpl)
{
    let tplData = tpl.getData();

    if (Object.keys(tplData).includes(`navigation`)) {

        let nav = tplData.navigation;
        if (!Array.isArray(nav)) {
            nav = [nav]
        }

        let store;
        if (!config.hasGlobalData('menus')) {
            store = {};
        } else {
            store = config.getGlobalData('menus');
        }

        for (let item of nav) {

            if (!item.menu) {
                debug(`Navigation spec must have a 'menu' setting. It consists of %O. Processing: ${tpl.relPath}`, nav);
                continue;
            }
            if (!store[item.menu]) {
                store[item.menu] = [];
            }
            if (!item.pos) {
                item.pos = 5;
            }
            if (!item.title) {
                item.title = tplData.title;
            }
            if (!item.description) {
                item.description = tplData.description;
            }
            let newItem = {
                data: item,
                tpl: tpl
            }
            store[item.menu].push(newItem);
            debug(`Storing for menu ${item.menu}: %O`, newItem.data);
        }
        config.addGlobalData('menus', store);
        debug(`Added navigation data from: ${tpl.relPath}`);
    }
}

module.exports = function(config, options = {}) {


    config.templateManager.getProcessor('nunjucks').addShortcode('menu', Menu);
    config.templateManager.getProcessor('nunjucks').addShortcode('menusubs', MenuSubs);
    config.templateManager.getProcessor('nunjucks').addShortcode('menuseq', MenuSeq);

    config.eventManager.on('AFTER_PROCESS_SINGLE_TEMPLATE', after_process_single_template);

    syslog.notice(`GreenFedora navigation plugin loaded.`);

}
