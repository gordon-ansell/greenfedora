/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode } = require('greenfedora-utils');

/**
 * Howtostep shortcode class.
 */
class HowtostepShortcode extends NunjucksShortcode
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

        let stepNum = args[0];
        let kwargs = args[1] || {};
        //this.site = this.config.userData.site || false;

        let name;
        if (kwargs.name) {
            name = kwargs.name;
            //delete kwargs.name;
        }

        let mde = this.config.getTemplateProcessor('markdown');

        let [html, text] = mde.parseMarkdown(body);
        //syslog.inspect(html, "warning");

        if (!kwargs.text) {
            kwargs.text = text;
        }

        let gd = this.config.getGlobalData('schema');
        if (null === gd) {
            gd = {};
        }

        if (!gd[ctxData.relPath]) {
            gd[ctxData.relPath] = {};
        }

        if (!gd[ctxData.relPath].howtostep) {
            gd[ctxData.relPath].howtostep = [];
        }

        let ss = {};
        for (let item in kwargs) {
            if (!item.startsWith('__')) {
                ss[item] = kwargs[item];
            }
        }

        gd[ctxData.relPath].howtostep.push(ss);
        this.config.addGlobalData('schema', gd);

        let ret = '';

        ret += `<div id="step-${stepNum}" class="howtostep">`;

            ret += `<h2>Step ${stepNum}: ${name}</h2>`;
            ret += html;

        ret += '</div>';

        return ret;
    }
}

module.exports = HowtostepShortcode;
 