/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const dateformat = require('dateformat');

/**
 * Display date.
 */
function displayDate(indate, df = "dS mmmm yyyy")
{
    let dt = new Date(indate);
    return dateformat(dt, df);
}

module.exports = displayDate;