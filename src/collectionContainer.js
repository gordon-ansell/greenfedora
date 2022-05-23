/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require('greenfedora-utils');
const Collection = require('./collection');

// Local error.
class GfCollectionContainerError extends GfError {};

/**
 * Collection container class.
 * Hosts multiple collections, like tags.
 */
class CollectionContainer
{
    /**
     * The individual collections in the container.
     * @member  {object}
     */
    colls = {};

    /**
     * Constructor.
     * 
     * @return  {Collection}
     */
    constructor()
    {
    }

    /**
     * See if we have a collection of a given name.
     * 
     * @param   {string}    name    Name to test.
     * 
     * @return  {boolean}
     */
    hasCollection(name)
    {
        return (name in this.colls);
    }

    /**
     * Get a collection.
     * 
     * @param   {string}    name                Name to retrieve.
     * @param   {boolean}   [autoCreate=false]  Auto create collection if necessary.
     * 
     * @return  {Collection}
     */
    getCollection(name, autoCreate = false)
    {
        if (!this.hasCollection(name)) {
            if (autoCreate) {
                this.createCollection(name);
            } else {
                throw new GfCollectionContainerError(`Container has no collection named '${name}'.`)
            }
        }
        return this.colls[name];
    }

    /**
     * Create a new collection.
     * 
     * @param   {string}    name    Name to create.
     * 
     * @return  {CollectionContainer}
     */
    createCollection(name)
    {
        if (this.hasCollection(name)) {
            throw new GfCollectionContainerError(`Container already has a collection name '${name}'.`); 
        }
        this.colls[name] = new Collection();

        return this;
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

module.exports = CollectionContainer;
