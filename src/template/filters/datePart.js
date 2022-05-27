/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

/**
 * Part of a date.
 */
function datePart(indate, part = 'year')
{
    let dt = new Date(indate);

    if ('year' === part) {
        return dt.getFullYear();
    } else if ('month' === part) {
        return dt.getMonth();
    } else if ('monthname' === part) {
        return dt.toLocaleString('default', { month: 'long' });
    } else if ('day' === part) {
        return dt.getDate();
    }

    return '';
}

module.exports = datePart;