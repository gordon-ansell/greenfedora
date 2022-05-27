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
            let ams = (new Date(a.date)).getMilliseconds();
            let bms = (new Date(b.date)).getMilliseconds();
            return (ams < b.ms) ? 1 : ((bms < ams) ? -1 : 0)
        });   

        return toSort;
    }

    /**
     * Load the live templates.
     * 
     * @return  {object}
     */
    loadLive()
    {
        let ret = [];
        for (let item of this.data) {
            if (!item in this.config.templates) {
                throw new GfCollectionError(`No '${item}' entry found in live templates.`);
            }
            ret.push(this.config.templates[item].getData());
        }
        return ret;
    }

    /**
     * Get all entries.
     * 
     * @return  {TemplateFile[]}
     */
    getAll()
    {
        let ret = this.loadLive();
        ret = this.sortDefault(ret);
        return ret;
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
