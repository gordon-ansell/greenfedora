/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const AssetProcessor = require('./assetProcessor');
const GfError = require('../../utils/gfError');
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
     * 
     * @return  {boolean}
     */
    process(filePath)
    {
        return true;
    }

}

module.exports = AssetProcessorImage;