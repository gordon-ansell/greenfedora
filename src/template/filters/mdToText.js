/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const showdown = require('showdown');
const st = require('striptags');

/**
 * Convert markdown to text.
 */
function mdToText(md)
{
    let converter = new showdown.Converter();
    let html = converter.makeHtml(md);
    return st(html);
}

module.exports = mdToText;