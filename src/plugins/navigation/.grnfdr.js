/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfError } = require('greenfedora-utils');
const Menu = require('./src/shortcodes/menu');
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
    let data = tpl.getData();
    if ('navigation' in data) {
        if (!data.navigation.menu) {
            //syslog.inspect(typeof data.navigation)
            //syslog.inspect(Object.keys(data.navigation));
            //throw new GfNavigationPluginError(`Navigation spec must have a 'menu' setting. Processing: ${tpl.relPath}`);
            debug(`Navigation spec must have a 'menu' setting. Processing: ${tpl.relPath}`);
            return;
        }
        let store;
        if (!config.hasGlobalData('navigation')) {
            store = {};
        } else {
            store = config.getGlobalData('navigation');
        }
        if (!store[data.navigation.menu]) {
            store[data.navigation.menu] = [];
        }
        if (!data.navigation.pos) {
            data.navigation.pos = 5;
        }
        let newItem = {
            data: data.navigation,
            tpl: tpl
        }
        store[data.navigation.menu].push(newItem);
        config.addGlobalData('navigation', store);
        debug(`Added navigation data from: ${tpl.relPath}`);
    }
}

module.exports = function(config, options = {}) {


    config.templateManager.getProcessor('nunjucks').addShortcode('menu', Menu);

    config.eventManager.on('AFTER_PROCESS_SINGLE_TEMPLATE', after_process_single_template);


    //config.assetHandlers.addHandler('image', new ImageAssetsHandler(config), ['jpg', 'jpeg', 'png', 'webp']);


    //config.addNunjucksShortcode('img', ImgShortcode, true);
    //debug(`Added shortcode to Nunjucks: img`);

    syslog.notice(`GreenFedora navigation plugin loaded.`);

}
