/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const RatingStars = require('./src/shortcodes/ratingstars');

module.exports = function(config, options = {}) {

    config.templateManager.getProcessor('nunjucks').addShortcode('ratingstars', RatingStars);

    syslog.notice(`GreenFedora rating stars plugin loaded.`);
}
