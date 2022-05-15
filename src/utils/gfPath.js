/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const path = require('path');
const lodashset = require("lodash/set");
const lodashget = require("lodash/get");
const { syslog } = require('./logger');

/**
 * Path utilities.
 */
class GfPath
{
    /**
     * Add a trailing slash to a path.
     * 
     * @param   {string}    p       Input path.
     * 
     * @return  {string}
     * @static
     */
    static addTrailingSlash(p)
    {
        if (path.sep !== p.charAt(p.length - 1)) {
            return p + path.sep;
        }
        return p;
    }

    /**
     * Add leading slash.
     * 
     * @param   {string}    str     String to add leading slash to.
     * 
     * @return  {string}
     * @static
     */
    static addLeadingSlash(str)
    {
        if (!str.startsWith('/')) {
            return '/' + str;
        }
        return str;
    }

    /**
     * Add both slashes.
     * 
     * @param   {string}    str     String to frig.
     * 
     * @return  {string}
     * @static
     */
    static addBothSlashes(str)
    {
        return GfPath.addTrailingSlash(GfPath.addLeadingSlash(str));
    }

    /**
     * Remove trailing slash.
     * 
     * @param   {string}    str     String to remove from.
     * 
     * @return  {string}
     * @static
     */
    static removeTrailingSlash(str)
    {
        if (str.endsWith('/')) {
            return str.substring(0, str.length - 1);
        }
        return str;
    }

    /**
     * Remove leading slash.
     * 
     * @param   {string}    str     String to remove from.
     * 
     * @return  {string}
     * @static
     */
    static removeLeadingSlash(str)
    {
        if (str.startsWith('/')) {
            return str.substring(1);
        }
        return str;
    }

    /**
     * Remove both slashes.
     * 
     * @param   {string}    str     String to frig.
     * 
     * @return  {string}
     * @static
     */
    static removeBothSlashes(str)
    {
        return GfPath.removeTrailingSlash(GfPath.removeLeadingSlash(str));
    }

    /**
     * Add data to and object at the depth specified by a path.
     * 
     * @param   {string}    inputPath   Input path.
     * @param   {object}    data        Data,
     * @param   {string}    sep         Path separator.
     * 
     * @return  {object}
     */
    static dataToObjectPath(inputPath, data, sep = path.sep)
    {
        inputPath = GfPath.removeBothSlashes(inputPath);

        let ret = {};

        if ('' == inputPath) {
            return data;
        }

        if (-1 === inputPath.indexOf(sep)) {
            ret[inputPath] = data;
            return ret;
        }

        lodashset(ret, inputPath.replaceAll(path.sep, '.'), data);
        return ret;
    }
}

module.exports = GfPath;