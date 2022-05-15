/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const GfError = require('../../utils/gfError');
const Merge = require('../../utils/merge');
const DirDataFiles = require('../../config/dirDataFiles');
const GlobalDataFileConfig = require('../../config/globalDataFileConfig');
const debug = require("debug")("GreenFedora:TemplateData");


// Local error.
class GfTemplateDataError extends GfError {};

/**
 * Template data.
 */
class TemplateData
{
    /**
     * File path.
     * @member  {string} 
     */
    filePath = null;

    /**
     * Config.
     * @member {Config}
     */
    config = null;

    /**
     * Global data.
     * @member {object}
     */
    globalData = null;

    /**
     * Layout data.
     * @member {object}
     */
    layoutData = null;

    /**
     * Directory data.
     * @member {object}
     */
    directoryData = null;

    /**
     * Front matter data.
     * @member {object}
     */
    frontMatterData = {};

    /**
     * Constructor.
     * 
     * @param   {string}    filePath    Path to the file.
     * @param   {Config}    config      Configs.
     * 
     * @return  {TemplateData}
     */
    constructor(filePath, config)
    {
        this.filePath = filePath;
        this.config = config;
    }

    /**
     * Get the global data.
     * 
     * @return  {object}
     */
    _getGlobalData()
    {
        if (null === this.globalData) {
            let base = this.config.getBaseConfig();
            let api = this.config.getGlobalData();
            let gdf = GlobalDataFileConfig.getData(this.config);
            this.globalData = Merge.mergeMany([base, api, gdf]);
        }
        return this.globalData;
    }

    /**
     * Get the directory data.
     * 
     * @return  {object}
     */
    _getDirData()
    {
        if (null === this.directoryData) {
            let dirdf = new DirDataFiles(this.filePath, this.config);
            this.directoryData = dirdf.read();
        }

        return this.directoryData;
    }

    /**
     * Merge all the data.
     * 
     * @return  {object}    Merged data.
     */
    mergeData()
    {
        let ret = this._getGlobalData();

        if (null !== this.layoutData) {
            ret = Merge.merge(ret, this.layoutData);
        }

        ret = Merge.merge(ret, this._getDirData());
        ret = Merge.merge(ret, this.frontMatterData);

        return ret;
    }

    /**
     * Dump.
     * 
     * @return  {object}
     */
    dump()
    {
        let d = {...Object.values(this)};
        delete(d.config);
        return d;
    }
}

module.exports = TemplateData;