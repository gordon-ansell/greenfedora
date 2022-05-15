/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const ResourceManager = require('./resourceManager');
const AssetProcessorImage = require('../asset/processors/assetProcessorImage');
const debug = require("debug")("GreenFedora:TemplateManager");

/**
 * Asset manager.
 */
class AssetManager extends ResourceManager
{

    /**
     * Constructor.
     * 
     * @param   {Config}            config      Config parent.
     * 
     * @return  {AssetManager}
     */
    constructor(config = null)
    {
        super('asset', config);
    }

    /**
     * Add the default asset processors.
     * 
     * @return  {AssetManager}
     */
    addDefaultProcessors()
    {
        // Images.
        let cfg = this.config.getBaseConfig().defaultAssetProcessors.image;
        this.addProcessor(
            'image', 
            new AssetProcessorImage(this.config, cfg.options, cfg.engineOptions),
            cfg.exts
        );
    }

}

module.exports = AssetManager;