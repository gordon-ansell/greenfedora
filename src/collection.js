/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require('greenfedora-utils');

// Local error.
class GfCollectionError extends GfError {};

/**
 * Collection class.
 */
class Collection
{
    /**
     * The collection data.
     * @member  {map}
     */
    data = null;

    /**
     * Constructor.
     * 
     * @return  {Collection}
     */
    constructor()
    {
        this.data = new Map();
    }

    /**
     * Add an item to the collection.
     * 
     * @param   {string}        key     Key to add.
     * @param   {TemplateFile}  tpl     Template file to add.
     * 
     * @return  {Collection}
     */
    add(key, tpl)
    {
        this.data.set(key, tpl);
        return this;
    }

    /**
     * Standard sort (descending).
     * 
     * @return  {Collection}
     */
    sortDefault()
    {
        this.data = new Map([...this.data.entries()].sort((a, b) => {
            let ams = (new Date(a[1].date)).getMilliseconds();
            let bms = (new Date(b[1].date)).getMilliseconds()
            return (ams < b.ms) ? 1 : ((bms < ams) ? -1 : 0)
        }));   

        return this;
    }

}

module.exports = Collection;
