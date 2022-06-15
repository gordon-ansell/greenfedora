/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, GfError } = require('greenfedora-utils');

class GfFaqQaShortcodeError extends GfError {};

/**
 * FAQ Q/A shortcode class.
 */
class FaqQaShortcode extends NunjucksShortcode
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
        let stepNum = args[0];
        let kwargs = args[1] || {};
        //this.site = this.config.userData.site || false;

        if (!kwargs.q) {
            throw new GfFaqQaShortcodeError(`FAQ 'qa' shortcode should have 'q' specified with the question: ${context.ctx.relPath}`);
        }

        let ctxData = context.ctx;

        let mde = this.config.getTemplateProcessor('markdown');

        let [html, text] = mde.parseMarkdown(body);

        if (!kwargs.text) {
            kwargs.text = text;
        }

        if (!kwargs.html) {
            kwargs.html = html;
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

        if (!gd[ctxData.relPath].faqqa) {
            gd[ctxData.relPath].faqqa = [];
        }

        gd[ctxData.relPath].faqqa.push(ss);
        this.config.addGlobalData('schema', gd);

        let ret = '';

        ret += `<a name="faq-${stepNum}"></a>`;
        ret += `<div id="faq-${stepNum}">`;

            ret += `<h3>${kwargs.q}</h3>`;
            ret += `<span class="faqanswer">`;
                ret += html;
             ret += `</span>`;
            
        ret += '</div>';

        return ret;
    }
}

module.exports = FaqQaShortcode;
 