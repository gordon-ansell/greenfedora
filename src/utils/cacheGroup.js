/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const FsUtils = require('./fsUtils');
const GfError = require('./gfError');
const debug = require("debug")("GreenFedora:CacheGroup");

// Local error.
class GfCacheGroupError extends GfError {};

/**
 * Cache group.
 */
class CacheGroup
{
    /**
     * Cache group name.
     * @member  {string|null}
     */
    #groupName = null;

    /**
     * The cache data.
     * @member  {Map}
     */
    #data = {};

    /**
     * Constructor.
     * 
     * @param   {string}        groupName   Name of the group.
     * 
     * @return  {CacheGroup}
     */
    constructor(groupName)
    {
        this.#groupName = groupName;
        this.#data = new Map();
    }

    /**
     * Get the group name.
     * 
     * @return  {string}
     */
    getGroupName()
    {
        return this.#groupName;
    }

    /**
     * See if we have an item.
     * 
     * @param   {any}       name    Name of item.
     * 
     * @return  {boolean}
     */
    has(name)
    {
        return this.#data.has(name);
    }

    /**
     * Get some data for a given name.
     * 
     * @param   {string}    name        Name of item to get.
     * 
     * @return  {any}                   Item data or null.
     */
    get(name)
    {
        if (this.has(name)) {
            return this.#data.get(name);
        }
        return null;
    }

    /**
     * Set some data.
     * 
     * @param   {string}    name        Name of item to set.
     * @param   {any}       val         Data value.
     * 
     * @return  {CacheGroup}
     */
    set(name, val)
    {
        this.#data.set(name, val);
        return this;
    }

    /**
     * Add some data.
     * 
     * @param   {string}    name        Name of item to add.
     * @param   {any}       val         Data value.
     * 
     * @return  {CacheGroup}
     * 
     * @throws  {GfCacheGroupError}     On errors.
     */
    add(name, val)
    {
        if (this.has(name)) {
            throw new GfCacheGroupError(`We already have a cache item called '${name}' in group '${this.#groupName}. Maybe use 'set' instead?`);
        }
        return this.set(name, val);
    }

    /**
     * Delete some data.
     * 
     * @param   {string}    name        Name of item to delete.
     * 
     * @return  {CacheGroup}
     * 
     * @throws  {GfCacheGroupError}     On errors.
     */
    del(name)
    {
        if (this.has(name)) {
            delete this.#data.delete(name);
        }
        return this;
    }

    /**
     * Load a cache group from disk.
     * 
     * @param   {string}        filePath    Path to load from.
     * 
     * @return  {CacheGroup}
     */
    load(filePath)
    {
        if (!fs.existsSync(filePath)) {
            debug(`No saved cache group for '${this.#groupName}' found at ${filePath}. This may be okay, but just saying.`);
            this.#data = new Map();
        } else {
            debug(`Loading cache group '${this.groupName}' from ${filePath}.`);
            let serialised = fs.readFileSync(filePath, 'utf8');
            this.#data = new Map(JSON.parse(serialised));
        }
        return this;
    }

    /**
     * Save a cache group to disk.
     * 
     * @param   {string}        filePath    Path to save to.
     * 
     * @return  {CacheGroup}
     */
    save(filePath)
    {
        if (!fs.existsSync(path.dirname(filePath))) {
            FsUtils.mkDirRecurse(path.dirname(filePath));
        }

        let serialised = JSON.stringify(Array.from(this.#data.entries()));
        fs.writeFileSync(filePath, serialised, 'utf8');
        debug(`Saving cache group '${this.groupName}' to ${filePath}.`);

        return this;
    }
}

module.exports = CacheGroup;