/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, syslog } = require('greenfedora-utils');

// Local error.
class GfCollectionError extends GfError {};

/**
 * Collection class.
 */
class Collection
{
    /**
     * Item name.
     * @member  {string}
     */
    name = null;

    /**
     * The collection data.
     * @member  {TemplateFile[]}
     */
    data = [];

    /**
     * Config.
     * @member  {Config}
     */
    config = null;

    /**
     * Constructor.
     * 
     * @param   {string}    name    Name of collection.
     * @param   {Config}    config  Configs.
     * 
     * @return  {CollectionItem}
     */
    constructor(name, config)
    {
        this.name = name;
        this.config = config;
    }

    /**
     * Add a template to the collection item.
     * 
     * @param   {TemplateFile}  tpl     Template file to add.
     * 
     * @return  {CollectionItem}
     */
    add(tpl)
    {
        this.data.push(tpl);
        return this;
    }

    /**
     * Standard sort (descending).
     * 
     * @param   {TemplateFile[]}    toSort  Array to sort.
     * 
     * @return  {TemplateFile[]}
     */
    sortDefault(toSort)
    {
        toSort.sort((a, b) => {
            let ams = (new Date(a.date)).valueOf();
            let bms = (new Date(b.date)).valueOf();
            return (ams < b.ms) ? 1 : ((bms < ams) ? -1 : 0)
        });   

        return toSort;
    }

    /**
     * Load the live templates.
     * 
     * @param   {boolean}   tplLoad     Load the whole template?    
     * 
     * @return  {object}
     */
    loadLive(tplLoad = false)
    {
        let ret = [];
        for (let item of this.data) {
            if (!item in this.config.templates) {
                throw new GfCollectionError(`No '${item}' entry found in live templates.`);
            }
            if (tplLoad) {
                ret.push(this.config.templates[item]);
            } else {
                ret.push(this.config.templates[item].getData());
            }
        }
        return ret;
    }

    /**
     * Get all entries.
     * 
     * @param   {string}    order       Order to return.
     * @param   {boolean}   tplLoad     Load the whole template?    
     * 
     * @return  {TemplateFile[]}
     */
    getAll(order = 'date-desc', tplLoad = false)
    {
        let ret = this.loadLive(tplLoad);
        if ('date-desc' === order) {
            ret = this.sortDefault(ret);
        }
        return ret;
    }

    /**
     * Get selected entries.
     * 
     * @param   {number}    from        Start record.
     * @param   {number}    maxSize     Maximum size.
     * @param   {string}    order       Order to return.
     * @param   {boolean}   tplLoad     Load the whole template?    
     * 
     * @return  {TemplateFile[]}
     */
    getSelected(from, maxSize, order = 'date-desc', tplLoad = false)
    {
        let tmp = this.loadLive(tplLoad);
        if ('date-desc' === order) {
            tmp = this.sortDefault(tmp);
        }

        let ret = tmp.slice(from, from + maxSize + 1);

        return ret;
    }

    /**
     * Get the size of the collection.
     * 
     * @return  {number}
     */
    getSize()
    {
        return this.data.length;
    }

    /**
     * Dump the items.
     * 
     * @return  {string[]}
     */
    dump()
    {
        return this.data;
    }

}

module.exports = Collection;
