/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const autoprefixer = require('autoprefixer');
const AssetProcessorScss = require('./assetProcessorScss');

module.exports = function(config) {

    let cfg = {
        options: {
            ignoreFileStart: '_',
            outputDir: '/assets/css',
            outputExt: '.css',
            postcss: {
                engineOptions: {
                    from: undefined
                },
                modules: [autoprefixer]
            }
        },
        engineOptions: {
            outputStyle: 'compressed'
        },
        exts: ['scss']
    };

    config.addAssetProcessor('scss', new AssetProcessorScss(config, cfg.options, cfg.engineOptions), cfg.exts);

    return {};

}