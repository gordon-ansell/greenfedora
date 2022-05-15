/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const fs = require('fs');

/**
 * File system utilities.
 */
class FsUtils
{
    /**
     * Make a directory recursively.
     * 
     * @param   {string}    dir     Directory to make.
     * 
     * @return  {void}
     */
    static mkDirRecurse(path)
    {
        fs.mkdirSync(path, { recursive: true })
    }

    /**
     * Make a directory recursively (async version).
     * 
     * @param   {string}    dir     Directory to make.
     * 
     * @return  {Promise}
     */
    static async mkDirRecurseAsync(path)
    {
        return fs.mkdir(path, { recursive: true })
    }
}

module.exports = FsUtils;