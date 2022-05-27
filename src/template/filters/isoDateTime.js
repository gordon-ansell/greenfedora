/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

/**
 * Display ISO date/time.
 */
function isoDateTime(indate)
{
    let dt = new Date(indate);
    return dt.toISOString();
}

module.exports = isoDateTime;