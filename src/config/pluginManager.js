/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, Merge } = require('greenfedora-utils');
const path = require('path');
const constants = require('./constants');
const fs = require('fs');
const debug = require("debug")("GreenFedora:PluginManager");

// Local exception.
class GfPluginManagerError extends GfError {};

/**
 * Plugin manager.
 */
class PluginManager
{
    /**
     * Plugins.
     * @member {object[]}
     */
    plugins = [];

    /**
     * User config.
     * @member  {Config}
     */
    config = null;

    /**
     * Constructor.
     * 
     * @param   {Config}            config      Config parent.
     * 
     * @return  {PluginManager}
     */
    constructor(config = null)
    {
        this.plugins = [];
        this.config = config;
    }

    /**
     * Get a plugin's name.
     * 
     * @param   {callable}      plugin          Plugin.
     * 
     * @return  {string}
     */
    getPluginName(plugin)
    {
        return plugin.name || 'anonymous';
    }

    /**
     * Add a plugin.
     * 
     * @param   {callable}      plugin          Something to execute.
     * @param   {object}        [options={}]    Plugin options.
     * 
     * @return  {PluginManager}
     * 
     * @throws  {GfPluginError}                 On error.
     */
    addPlugin(plugin, options = {})
    {
        if ('function' !== typeof plugin) {
            throw new GfPluginManagerError(`Plugin entry points must be a function (processing ${this.getPluginName(plugin)})`)
        }
        this.plugins.push({plugin, options});
        debug(`Added plugin: %s`, this.getPluginName(plugin));
        return this;
    }

    /**
     * Add a built-in plugin.
     * 
     * @param   {string}        pluginName      Plugin name.
     * @param   {object}        [options={}]    Plugin options.
     * 
     * @return  {PluginManager}
     * 
     * @throws  {GfPluginError}                 On error.
     */
    addBuiltInPlugin(pluginName, options = {})
    {
        //let pluginCf = '../plugins/' + pluginName + '/' + constants.CONTROL_FILE_NAME;
        let pluginCf = path.join('../plugins', pluginName, constants.CONTROL_FILE_NAME);
        let plugin;
        try {
            plugin = require(pluginCf);
        } catch (err) {
            throw new GfPluginManagerError(`Unable to require control file (.grnfdr) for plugin '${pluginName}'.`, null, err)
        }

        if ('function' !== typeof plugin) {
            throw new GfPluginManagerError(`Plugin entry points must be a function (processing ${this.getPluginName(plugin)})`)
        }
        
        this.plugins.push({plugin, options});
        debug(`Added built-in plugin: %s`, this.getPluginName(plugin));
        return this;
    }

    /**
     * Load a plugin.
     * 
     * @param   {callable}      plugin          Something to execute.
     * @param   {object}        [options={}]    Plugin options.
     * 
     * @return  {object}                        Config data returned from plugin.
     * 
     * @throws  {GfPluginError}                 On error.
     */
    loadPlugin(plugin, options = {})
    {
        let result;
        try {
            result = plugin(this.config, options);
        } catch(err) {
            throw new GfPluginManagerError(`Failed to load plugin '${this.getPluginName(plugin)}'.`, null, err);
        }
        debug(`Loaded plugin: %s`, this.getPluginName(plugin));
        return result;
    }

    /**
     * Load all the plugins.
     * 
     * @return  {object}                        Combined config data from the plugins.
     * 
     * @todo    Do we need to check we don't overwrite something?
     */
    loadPlugins()
    {
        let result = {};

        for (let {plugin, options} of this.plugins) {
            let tmp = this.loadPlugin(plugin, options);
            if ('object' == typeof tmp) {
                result = Merge.merge(result, tmp);
            }
        }

        return result;
    }

}

module.exports = PluginManager;