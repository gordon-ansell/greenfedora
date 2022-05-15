/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const ResourceProcessor = require('../../resource/processors/resourceProcessor');
const debug = require("debug")("GreenFedora:AssetProcessor");

/**
 * Asset processing (base) class.
 */
class AssetProcessor extends ResourceProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Configs.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {AssetProcessor}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);
    }

}

module.exports = AssetProcessor;