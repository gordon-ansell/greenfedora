/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const debug = require("debug")("GreenFedora:ResourceProcessor");

/**
 * Resource processing (base) class.
 */
class ResourceProcessor
{
    /**
     * Config.
     * @member  {Config}
     */
    config = null;

    /**
     * Options.
     * @member  {object}
     */
    options = {};

    /**
     * Engine options.
     * @member  {object}
     */
    engineOptions = {};

    /**
     * The engine.
     * @member  {object}
     */
    engine = null;

    /**
     * Constructor.
     * 
     * @param   {Config}    config          Config.
     * @param   {object}    options         Options.
     * @param   {object}    engineOptions   Engine options.
     * 
     * @return  {ResourceProcessor}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        this.config = config;
        this.options = options;
        this.engineOptions = engineOptions;
    }

}

module.exports = ResourceProcessor;