/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, FsUtils } = require('greenfedora-utils');
const AssetProcessorImage = require('./src/assetProcessorImage');
const Img = require('./src/shortcodes/img');
const path = require('path');
const fs = require('fs');
const debug = require('debug')('GreenFedora:Plugin:images');

async function copyGeneratedImages(config)
{
    let imageConfig = config.getGlobalData('imageConfig');

    let indir = path.join(config.sitePath, imageConfig.options.outputDir);
    let outdir = path.join(config.outputPath, imageConfig.options.outputDir);

    if (!fs.existsSync(outdir)) {
        FsUtils.mkDirRecurse(outdir);
    }

    debug(`Copying ${indir} to ${outdir}`)

    FsUtils.copyDir(indir, outdir);
}

module.exports = function(config, options = {}) {

    let cfg = {
        options: {
            exts: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            placeholderWidth: 24,
            widths: [1920, 1280, 1024, 768, 480, 320],
            upscaling: false,
            aliases: {
                jpg: 'jpeg'
            },
            formats: {
                png: ['webp', 'png'],
                jpeg: ['webp', 'jpeg'],
                webp: ['webp', 'jpeg'],
                gif: ['webp', 'gif']
            },
            baseTypes: ['jpg', 'jpeg', 'png'],
            sharp: {
                constructorOptions: {},
                imageTypeOptions: {
                    png: {},
                    jpeg: {},
                    webp: {},
                    svg: {},
                    avif: {},
                }
            },
            filenameMask: '{fn}-{width}.{ext}',
            generateThumbnail: true,
            thumbnailSize: {
                width: 1280,
                height: 720
            },
            thumbnailFilenameMask: '{fn}-{width}-thumbnail.{ext}',
            genDir: '_generatedImages',
            outputDir: config.asset('_generatedImages'),
            mimes: {
                jpeg: "image/jpeg",
                jpg: "image/jpeg",
                webp: "image/webp",
                png: "image/png",
                svg: "image/svg+xml",
                avif: "image/avif",      
                gif: "image/gif" 
            },
            generated: new Map(),
            generatedStoreFile: '.generatedImages.json', 
            generatedStorePath: undefined,
        },
        engineOptions: {
            constructorOptions: {},
            imageTypeOptions: {
                png: {},
                jpeg: {},
                webp: {},
                svg: {},
                avif: {},
            }
        },
        exts: ['jpg', 'jpeg', 'png', 'webp'],
    };

    cfg.options.generatedStorePath = path.join(config.sitePath, cfg.options.generatedStoreFile);

    config.addGlobalData('imageConfig', cfg);

    //config.assetHandlers.image = imageCfg;

    config.addAssetProcessor('image', new AssetProcessorImage(config, cfg.options, cfg.engineOptions), cfg.exts);

    //syslog.inspect(config.templateManager);

    config.templateManager.getProcessor('nunjucks').addShortcode('img', Img);

    config.eventManager.on('AFTER_PROCESS_ASSETS', copyGeneratedImages);


    //config.assetHandlers.addHandler('image', new ImageAssetsHandler(config), ['jpg', 'jpeg', 'png', 'webp']);


    //config.addNunjucksShortcode('img', ImgShortcode, true);
    debug(`Added shortcode to Nunjucks: img`);

    syslog.log(`GreenFedora image plugin loaded.`);

}
