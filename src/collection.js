/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, syslog } = require('greenfedora-utils');
const { map } = require('lodash');

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
     * @member  {Map}
     */
    data = null;

    /**
     * Config.
     * @member  {Config}
     */
    config = null;

    /**
     * Current sort.
     * @member  {string}
     */
    currentSort = '';

    /**
     * Is dirty?
     * @member  {boolean}
     */
    isDirty = false;

    /**
     * Constructor.
     * 
     * @param   {string}    name    Name of collection.
     * @param   {Config}    config  Configs.
     * 
     * @return  {Collection}
     */
    constructor(name, config)
    {
        this.name = name;
        this.config = config;
        this.data = new Map();
    }

    /**
     * Add a template to the collection item.
     * 
     * @param   {string}        name    Name.
     * @param   {TemplateFile}  tpl     Template file to add.
     * 
     * @return  {Collection}
     */
    add(name, tpl)
    {
        this.data.set(name, tpl);
        this.isDirty = true;
        return this;
    }

    /**
     * Reload the collections from the live templates.
     * 
     * @return  {void}
     */
    reload()
    {
        for (let idx of this.data.keys()) {
            if (this.config.templates[idx]) {
                syslog.warning(`Reloading ${idx}`)
                this.data.set(idx, this.config.templates[idx]);
            }
        }
    }

    /**
     * Standard sort (descending).
     * 
     * @return  {void}
     */
    sortDefault()
    {
        if ('date-desc' !== this.currentSort || this.isDirty) {
            this.data = new Map([...this.data.entries()].sort((a, b) => {
                let ams = (new Date(a[1].getData().date)).valueOf();
                let bms = (new Date(b[1].getData().date)).valueOf();
                return (ams < b.ms) ? 1 : ((bms < ams) ? -1 : 0)
            }));   
            this.currentSort = 'date-desc';
        }
    }

    /**
     * Get all entries.
     * 
     * @param   {string}    order       Order to return.
     * 
     * @return  {TemplateFile[]}
     */
    getAll(order = 'date-desc')
    {
        //this.reload();
        if ('date-desc' === order) {
            this.sortDefault();
        }
        return [...this.data.values()];
    }

    /**
     * Get selected entries.
     * 
     * @param   {number}    from        Start record.
     * @param   {number}    maxSize     Maximum size.
     * @param   {string}    order       Order to return.
     * 
     * @return  {TemplateFile[]}
     */
    getSelected(from, maxSize, order = 'date-desc')
    {
        //this.reload();

        if ('date-desc' === order) {
            this.sortDefault();
        }

        return [...this.data.values()].slice(from, from + maxSize + 1);

    }

    /**
     * Get the latest modified date for items in this collection.
     * 
     * @return  {string}
     */
    getLatestModifiedDate()
    {
        let arr = [...this.data.values()];
        let latest = null;
        for (let item of arr) {
            if (null === latest || item.stats.mtimeMs > latest.mtimeMs) {
                latest = item.stats.mtimeMs;
            }
        }
        return latest;
    }

    /**
     * Get the size of the collection.
     * 
     * @return  {number}
     */
    getSize()
    {
        return this.data.size;
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

    /**
     * Get the stats for a bunch of collections.
     * 
     * @param   {string}    group           What to get them for.
     * @param   {string}    [sort=key]      Sort by? 
     * 
     * @return  {object}
     */
    static getStats(group, sort = 'key') 
    {
        let keys = Object.keys(group);

        let ret = {};
        for (let key of keys) {
            ret[key] = group[key].getSize();
        }

        let ordered;
        if ('key' === sort) {
            ordered = Object.keys(ret).sort().reduce(
                (obj, key) => { 
                    obj[key] = ret[key]; 
                    return obj;
                }, 
                {}
            );
        } else {
            ordered = Object.fromEntries(
                Object.entries(ret).sort(([,a],[,b]) => b-a)
            );
        }

        return ordered;
    }

}

module.exports = Collection;
