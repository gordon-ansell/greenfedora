/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, AssetProcessor, FsUtils } = require('greenfedora-utils');
const path = require('path');
const debug = require("debug")("GreenFedora:AssetProcessorImage");

// Local error.
class GfAssetProcessorImageError extends GfError {};

/**
 * Asset processing for images.
 */
class AssetProcessorImage extends AssetProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Config.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {AssetProcessorImage}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);

        try {
        } catch (err) {
            throw new GfAssetProcessorImageError(`Unable to create image engine`, null, err);
        }

        debug(`Loaded image asset processor.`);
    }

    /**
     * Process a file.
     * 
     * @param   {string}    filePath    File to process.
     * @param   {boolean}   skip        Skip?
     * 
     * @return  {boolean}
     */
    process(filePath, skip = false)
    {
        // By default we just copy the file.
        let op = path.join(this.config.outputPath, filePath.replace(this.config.sitePath, ''));

        FsUtils.mkDirRecurse(path.dirname(op));
        FsUtils.copyFile(filePath, op);

        syslog.log(`Processed image asset: ${filePath.replace(this.config.sitePath, '')}`);

        return true;
    }

}

module.exports = AssetProcessorImage;