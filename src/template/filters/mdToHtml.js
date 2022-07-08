/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const showdown = require('showdown');

/**
 * Convert markdown to html.
 */
function mdToHtml(md)
{
    let converter = new showdown.Converter();
    return converter.makeHtml(md);
}

module.exports = mdToHtml;