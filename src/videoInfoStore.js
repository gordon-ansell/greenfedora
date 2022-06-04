/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, GfPath, syslog } = require('greenfedora-utils');
const debug = require("debug")('GreenFedora:ImageInfoStore');
const debugdev = require("debug")('Dev.GreenFedora:VideoInfoStore');

class GfVideoInfoStoreError extends GfError {};

/**
 * Video info store.
 */
class VideoInfoStore
{
    /**
     * Full config.
     * @member {Config}
     */
    config = null;

    /**
     * The actual store.
     * @member {object}
     */
    store = {bySrc: {}, byPage: {}};

    /**
     * Constructor.
     * 
     * @param   {Config}    config  Configs.
     * 
     * @return  {VideoInfostore}
     */
    constructor(config)
    {
        this.config = config;
    }

    /**
     * Add some metadata by source AND page.
     * 
     * @param   {string}    src     Base source name.
     * @param   {string}    page    Page name.
     * @param   {object}    info    Info metadata.
     * 
     * @return  {VideoInfoStore}
     */
    addBySrcAndPage(src, page, info)
    {
        if (!this.hasBySrc(src)) {
            this.addBySrc(src, info);
        }
        this.addByPage(page, src);
        return this;
    }

    /**
     * Add some metadata by source.
     * 
     * @param   {string}    src     Base source name.
     * @param   {object}    info    Info metadata.
     * 
     * @return  {VideoInfoStore}
     */
    addBySrc(src, info)
    {
        if (!this.hasBySrc(src)) {
            this.store.bySrc[src] = info;
        }
        return this;
    }

    /**
     * See if we have something by source.
     * 
     * @param   {string}    src     Source to test.
     * 
     * @return  {boolean}
     */
    hasBySrc(src)
    {
        return Object.keys(this.store.bySrc).includes(src);
    }

    /**
     * Get video info by source.
     * 
     * @param   {string}    src         Source to retrieve.
     * @param   {boolean}   mustExist   Must this exist?
     * 
     * @return  {object}
     * 
     * @throws  {GfVideoInfoStoreError}
     */
    getBySrc(src, mustExist = true)
    {
        if (!this.hasBySrc(src)) {
            if (mustExist) {
                throw new GfVideoInfoStoreError(`Could not retrieve video by source: ${src}`);
            } else {
                return null;
            }
        }

        return this.store.bySrc[src];
    }


    //
    // ==============================================================================================
    //

    /**
     * Add some metadata by page.
     * 
     * @param   {string}    page    Page URL.
     * @param   {string}    src     Source name to store.
     * 
     * @return  {VideoInfoStore}
     */
    addByPage(page, src)
    {
        page = GfPath.removeBothSlashes(page);
        if (!this.store.byPage[page]) {
            this.store.byPage[page] = [];
        }
        this.store.byPage[page].push(src);
        return this;
    }

    /**
     * See if we have something by page.
     * 
     * @param   {string}    page    Page to test.
     * 
     * @return  {boolean}
     */
    hasByPage(page)
    {
        page = GfPath.removeBothSlashes(page);
        return Object.keys(this.store.byPage).includes(page);
    }

    /**
     * Get video info by page.
     * 
     * @param   {string}    page        Page to retrieve.
     * @param   {boolean}   mustExist   Must this exist?
     * 
     * @return  {object}
     * 
     * @throws  {GfVideoInfoStoreError}
     */
    getByPage(page, mustExist = false)
    {
        page = GfPath.removeBothSlashes(page);

        if (!this.hasByPage(page)) {
            if (mustExist) {
                throw new GfVideoInfoStoreError(`Could not retrieve video by page: ${page}`);
            } else {
                return null;
            }
        }

        let ret = [];
        for (let src of this.store.byPage[page]) {
            ret.push(this.getBySrc(src));
        }

        return ret;
    }

}

module.exports = VideoInfoStore;