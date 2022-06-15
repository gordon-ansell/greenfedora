/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, duration } = require('greenfedora-utils');

/**
 * FAQ page shortcode class.
 */
class FaqPageShortcode extends NunjucksShortcode
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

        let mde = this.config.getTemplateProcessor('markdown');

        let [html, text] = mde.parseMarkdown(body);


        let ctxData = context.ctx;
        let kwargs = {name: args[0]};


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

        gd[ctxData.relPath].faqpage = ss;
        this.config.addGlobalData('schema', gd);

        let ret = '';

        ret += `<div class="faq">`;
            ret += html;
        ret += '</div>';

        return ret;
    }
}

module.exports = FaqPageShortcode;
 