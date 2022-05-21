/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const debug = require("debug")("GreenFedora:ImagesInfo");

/**
 * Image manager.
 */
class ImageManager
{
    /**
     * Config.
     * @member  {Config}
     */
    config = null;

    /**
     * Constructor.
     * 
     * @param   {Config}            config      Config parent.
     * 
     * @return  {ImageManager}
     */
    constructor(config = null)
    {
        this.config = config;
    }

}

module.exports = ImageManager;