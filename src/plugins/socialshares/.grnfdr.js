/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfError } = require('greenfedora-utils');
const SocialShares = require('./src/shortcodes/socialshares');
const debug = require('debug')('GreenFedora:Plugin:socialshares');

class GfSocialSharesPluginError extends GfError {}''


module.exports = function(config, options = {}) {

    config.templateManager.getProcessor('nunjucks').addShortcode('socialshares', SocialShares);

    syslog.log(`GreenFedora social shares plugin loaded.`);

}
