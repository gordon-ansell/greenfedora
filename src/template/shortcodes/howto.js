/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, duration } = require('greenfedora-utils');

/**
 * Howto shortcode class.
 */
class HowtoShortcode extends NunjucksShortcode
{
    /**
     * Render.
     * 
     * @param   {object}    context     URL.
     * @param   {Array}     args        Other arguments.
     * 
     * @return  {string}
     */
    renderPaired(context, body, args)
    {
        let ctxData = context.ctx;
        let kwargs = args[0] || {};

        if (!kwargs.name) {
            kwargs.name = ctxData.title;
        }

        if (!kwargs.description) {
            kwargs.description = ctxData.description;
        }

        if (kwargs.totalTime) {
            let [pt, txt] = duration(kwargs.totalTime);
            kwargs.totalTime = pt;
        } else {
            if (this.config.schemaWarnings) {
                syslog.warning(`HowTo schema should have a 'totalTime' specified: ${ctxData.permalink}.`)
            }
        }

        if (!kwargs.supply) {
            kwargs.supply = 'n/a';
        }

        if (!kwargs.tool) {
            kwargs.tool = 'n/a';
        }

        let gd = this.config.getGlobalData('schema');
        if (null === gd) {
            gd = {};
        }

        if (!gd[ctxData.relPath]) {
            gd[ctxData.relPath] = {};
        }

        let ss = {};
        for (let item in kwargs) {
            if (!item.startsWith('__')) {
                ss[item] = kwargs[item];
            }
        }

        gd[ctxData.relPath].howto = ss;
        this.config.addGlobalData('schema', gd);

        let ret = '';

        ret += `<div class="howto">`;
            ret += body;
        ret += '</div>';

        return ret;
    }
}

module.exports = HowtoShortcode;
 