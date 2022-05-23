/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError } = require('greenfedora-utils');
const CollectionItem = require('./collectionItem');

// Local error.
class GfCollectionError extends GfError {};

/**
 * Collection class.
 */
class Collection
{
    /**
     * The individual items in the collection.
     * @member  {object}
     */
    items = {};

    /**
     * Constructor.
     * 
     * @return  {Collection}
     */
    constructor()
    {
    }

    /**
     * See if we have an item of a given name.
     * 
     * @param   {string}    name    Name to test.
     * 
     * @return  {boolean}
     */
    hasItem(name)
    {
        return (name in this.items);
    }

    /**
     * Get a collection item.
     * 
     * @param   {string}    name                Name to retrieve.
     * @param   {boolean}   [autoCreate=false]  Auto create collection if necessary.
     * 
     * @return  {CollectionItem}
     */
    getItem(name, autoCreate = false)
    {
        if (!this.hasItem(name)) {
            if (autoCreate) {
                this.createItem(name);
            } else {
                throw new GfCollectionError(`Collection has no item named '${name}'.`)
            }
        }
        return this.items[name];
    }

    /**
     * Create a new collection item.
     * 
     * @param   {string}    name    Name to create.
     * 
     * @return  {Collection}
     */
    createItem(name)
    {
        if (this.hasItem(name)) {
            throw new GfCollectionError(`Collection already has an item named '${name}'.`); 
        }
        this.items[name] = new CollectionItem();

        return this;
    }

}

module.exports = Collection;
