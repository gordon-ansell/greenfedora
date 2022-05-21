/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const absoluteUrl = require('./absoluteUrl');

/**
 * HTML URL filter. Make all relative URLs found into absolute URLs.
 */
function htmlAbsUrl(content, base, noimages = false)
{
    let ret = content;
    let regex = /(srcset|src|href)="(.*?)"/gmi;
    if (noimages) {
        regex = /(href)="(.*?)"/gmi;
    }
    let m;
    let srcsets = [];
    let links = [];
    while ((m = regex.exec(content)) !== null) {

        if (m) {
            let htmlParam = m[1];
            let link = m[2];
            if (!link.trim().startsWith('http') && !link.trim().startsWith('https')) {
                if ('srcset' == htmlParam) {
                    let commaSp = link.trim().split(',');
                    for (let item of commaSp) {
                        if (item.trim().includes(' ')) {
                            let spaceSp = item.trim().split(' ');
                            if (spaceSp.length > 1) {
                                let lastBit = spaceSp[spaceSp.length - 1];
                                if ('w' == lastBit[lastBit.length - 1]) {
                                    spaceSp.pop();
                                }
                            }
                            links.push(spaceSp.join(' ')); 
                        } else {
                            links.push(item.trim());
                        }
                    }

                } else {
                    links.push(link.trim());
                }
            }
        }

    }

    links = [... new Set(links)];

    for (let l of links) {
        ret = ret.replaceAll(l, absoluteUrl(l, base));
    }

    if (ret.includes(base.trim() + base.trim())) {
        ret = ret.replaceAll(base.trim() + base.trim(), base.trim());
    }

    if (ret.includes(base.trim() + base.trim())) {
        syslog.warning('Content return from htmlabsurlFilter contains double bases.');
    }

    return ret;
}

module.exports = htmlAbsUrl;