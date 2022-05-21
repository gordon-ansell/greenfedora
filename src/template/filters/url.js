/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const path = require('path');
const { syslog } = require('greenfedora-utils');

/**
 * URL filter. Ensure a URL is properly constructed.
 */
function url(url, base = '/')
{
    if (!url || "string" !== typeof url) {
        syslog.error(`The 'url' filter needs to act on a string, got ${typeof url}.`);
        return url;
    }
    let ret = url;

    if (!ret.startsWith(base)) {
        ret = path.join(base, ret);
    }

    return ret;
}

module.exports = url;