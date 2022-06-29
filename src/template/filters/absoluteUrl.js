/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfPath } = require('greenfedora-utils');
const { URL } = require('url');
const path = require('path');

/**
 * Absolute URL filter. Make a relative URL an absolute URL.
 */
function absoluteUrl(url, base)
{
    if (!url || "string" !== typeof url) {
        syslog.error(`The 'absoluteUrl' filter needs to act on a string, got ${typeof url}.`);
        return url;
    }

    if (!base || "string" !== typeof base) {
        syslog.error(`The 'absoluteUrl' filter needs a string 'base' passed in, got ${typeof base}.`);
        return url;
    }

    if (url.trim().startsWith('https://') || url.trim().startsWith('http://')) {
        return url.trim();
    }

    let ret = (new URL(url.trim(), base.trim())).toString();

    if (ret.startsWith(base.trim() + base.trim())) {
        syslog.error(`Double base error in absurl filter: ${ret}`);
    }

    if (-1 !== ret.indexOf('index.html')) {
        ret = ret.replace('index.html', '');
    }

    if ('' === path.extname(ret)) {
        ret = GfPath.addTrailingSlash(ret);
    }

    return ret;
}

module.exports = absoluteUrl;