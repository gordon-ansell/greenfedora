/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfString } = require('greenfedora-utils');

/**
 * Slugify filter.
 */
function slugify(str)
{
    return GfString.slugify(str);
}

module.exports = slugify;