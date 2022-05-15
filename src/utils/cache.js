/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const CacheGroup = require('./cacheGroup');
const fs = require('fs');
const GfError = require('./gfError');
const path = require('path');
const { syslog } = require('./logger');
const debug = require("debug")("GreenFedora:Cache");

// Local error.
class GfCacheError extends GfError {};

/**
 * Cache system.
 */
class Cache
{
    /**
     * The cache groups.
     * @member  {object|null}
     */
    #groups = null;

    /**
     * Constructor.
     * 
     * @return  {Cache}
     */
    constructor()
    {
        this.reset();
    }

    /**
     * Reset (clear) the cache.
     * 
     * @return  {Cache}
     */
    reset()
    {
        this.#groups = {_: new CacheGroup('_')};
    }

    /**
     * See if we have a cache group.
     * 
     * @param   {string}    name    Name to check.
     * 
     * @return  {boolean}
     */
    hasGroup(name)
    {
        return (name in this.#groups);
    }

    /**
     * Add a cache group.
     * 
     * @param   {string}    name    Group name.
     * 
     * @return  {Cache}
     * 
     * @throws  {GfCacheError}      On any errors.
     */
    addGroup(name)
    {
        if ('_' === name) {
            throw new GfCacheError(`The cache group called '${name}' is reserved. You can't create it.`);
        }
        if (this.hasGroup(name)) {
            throw new GfCacheError(`A cache group called '${name}' already exists.`);
        }
        this.#groups[name] = new CacheGroup(name);
        debug(`Created new cache group: %s`, name);

        return this;
    }

    /**
     * Get a cache group.
     * 
     * @param   {string}    name    Group name.
     * 
     * @return  {CacheGroup}
     * 
     * @throws  {GfCacheError}      On any errors.
     */
    getGroup(name)
    {
        if (!this.hasGroup(name)) {
            throw new GfCacheError(`There is no cache group called '${name}'.`);
        }
        return this.#groups[name];
    }

    /**
     * Delete a cache group.
     * 
     * @param   {string}    name    Group name.
     * 
     * @return  {Cache}
     * 
     * @throws  {GfCacheError}      On any errors.
     */
    delGroup(name)
    {
        if ('_' === name) {
            throw new GfCacheError(`The cache group called '${name}' is reserved. You can't delete it.`);
        }
        if (this.hasGroup(name)) {
            delete this.#groups[name];
            debug(`Deleted cache group: %s`, name);
        }
    }

    /**
     * See if a cache item exists.
     * 
     * @param   {string}    name            Name of item.
     * @param   {string}    [group='_']     Group to look in.
     * 
     * @return  {boolean}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    has(name, group='_')
    {
        if (!this.hasGroup(group)) {
            throw new GfCacheError(`Cannot check if '${name}' exists in group '${group}' because the group does not exist.`);
        }
        return this.getGroup(group).has(name);
    }

    /**
     * Get a cache item.
     * 
     * @param   {string}    name            Name of item.
     * @param   {string}    [group='_']     Group to look in.
     * 
     * @return  {any}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    get(name, group='_')
    {
        if (!this.hasGroup(group)) {
            throw new GfCacheError(`Cannot get '${name}' from group '${group}' because the group does not exist.`);
        }
        return this.getGroup(group).get(name);
    }

    /**
     * Add a cache item.
     * 
     * @param   {string}    name            Name of item.
     * @param   {any}       val             Value of item.
     * @param   {string}    [group='_']     Group to look in.
     * 
     * @return  {Cache}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    add(name, val, group='_')
    {
        if (!this.hasGroup(group)) {
            throw new GfCacheError(`Cannot add '${name}' to group '${group}' because the group does not exist.`);
        }
        this.getGroup(group).add(name, val);
        return this;
    }

    /**
     * Set a cache item.
     * 
     * @param   {string}    name            Name of item.
     * @param   {any}       val             Value of item.
     * @param   {string}    [group='_']     Group to look in.
     * 
     * @return  {Cache}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    set(name, val, group='_')
    {
        if (!this.hasGroup(group)) {
            throw new GfCacheError(`Cannot set '${name}' in group '${group}' because the group does not exist.`);
        }
        this.getGroup(group).set(name, val);
        return this;
    }

    /**
     * Delete a cache item.
     * 
     * @param   {string}    name            Name of item.
     * @param   {string}    [group='_']     Group to look in.
     * 
     * @return  {Cache}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    del(name, group='_')
    {
        if (!this.hasGroup(group)) {
            throw new GfCacheError(`Cannot delete '${name}' from group '${group}' because the group does not exist.`);
        }
        this.getGroup(group).del(name);
        return this;
    }

    /**
     * Save cache groups.
     * 
     * @param   {string}            dirPath     Directory path to save them to. Filename is group name.
     * @param   {string[]|null}     groups      Groups to save.
     * 
     * @return  {void}
     */
    async save(dirPath, groups = null)
    {
        if (null === groups) {
            groups = Object.keys(this.#groups);
        }

        await Promise.all(groups.map(async groupName => {
            if (this.hasGroup(groupName)) {
                this.#groups[groupName].save(path.join(dirPath, groupName + '.json'));
            }
        }));

    }

    /**
     * Load cache groups.
     * 
     * @param   {string}            dirPath     Directory path to load them from. Filename is group name.
     * @param   {string[]|null}     groups      Groups to load.
     * 
     * @return  {void}
     * 
     * @throws  {GfCacheError}              If the group does not exist.
     */
    async load(dirPath, groups = null)
    {
        if (!fs.existsSync(dirPath)) {
            syslog.warn(`Attempting to load cache groups from '${dirPath}', but the path is not found. This may be okay, but I'm letting you know.`);    
            if (groups) {
                for (let g of groups) {
                    this.addGroup(g);
                }
            }
            return;
        }

        if (null === groups) {
            let entries = fs.readdirSync(dirPath);
            let extracted = [];
            for (let f of entries) {
                if ('.json' === path.extname(f)) {
                    extracted.push(path.basename(f, path.extname(f)));
                }
            }
            if (0 === extracted.length) {
                syslog.warn(`Attempting to load cache groups (automatically) from '${dirPath}', but the path is not found. This may be okay, but note that no cache groups will be created.`);    
                return;
            } else {
                groups = extracted;
            }
        }

        await Promise.all(groups.map(async groupName => {
            if (!this.hasGroup(groupName)) {
                this.addGroup(groupName)
            }
            this.#groups[groupName].load(path.join(dirPath, groupName + '.json'));
        }));

    }
}

module.exports = Cache;