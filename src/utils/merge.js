/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { isPlainObject } = require('is-plain-object');
const dm = require('deepmerge');

/**
 * Merge class
 */
class Merge {

    /**
     * Merge things.
     * 
     * @param   {object}    first       First thing.
     * @param   {object}    second      Second thing.
     * @param   {object}    opts        Options.
     * 
     * @return  {object}                Merged thing. 
     */
    static merge(first, second, opts = {arrayMerge: dm.combineMerge, isMergeableObject: isPlainObject})
    {
        return dm(first, second, opts)
    }

    /**
     * Merge many things.
     * 
     * @param   {object[]}  objs        Objects.
     * @param   {object}    opts        Options.
     * 
     * @return  {object}                Merged thing. 
     */
    static mergeMany(objs, opts = {arrayMerge: dm.combineMerge, isMergeableObject: isPlainObject})
    {
        return dm.all(objs, opts);
    }
}
 
module.exports = Merge;
