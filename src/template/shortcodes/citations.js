/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, NunjucksShortcode } = require("greenfedora-utils");

/**
 * Citations shortcode class.
 */
class CitationsShortcode extends NunjucksShortcode
{
    /**
     * Render.
     * 
     * @param   {object}    context     URL.
     * @param   {Array}     args        Other arguments.
     * 
     * @return  {string}
     */
    render(context, args)
    {
        if (!args[0].citation) {
            return '';
        }

        let citations = args[0].citation;

        if (!Array.isArray(citations)) {
            citations = [citations]
        }

        let ret = '';

        try {

            for (let item of citations) {

                let cite = item.title;

                let url;
                if (item.url) {
                    url = item.url;
                } else if (args[0].externalLink) {
                    url = args[0].externalLink;
                }

                if (url) {
                    cite = `<a href="${url}" target="_blank">${cite}</a>`;
                }

                cite = `<cite>${cite}</cite>`;

                if (item.author) {
                    cite += ` by `;

                    if (item.author.url) {
                        cite += `<a href="${item.author.url}" target="_blank">${item.author.name}</a>`;
                    } else {
                        cite += item.author.name;
                    }
                }

                if (item.site) {
                    cite += ` on `;

                    if (item.site.url) {
                        cite += `<a href="${item.site.url}">${item.site.name}</a>`;
                    } else {
                        cite += item.site.name;
                    }
                }

                ret += `<li>${cite}</li>`;

            }

            return `<ul>${ret}</ul>`;
        } catch (err) {
            syslog.error(`Error in citations shortcode: ${err.message}`);
        }
    }
}

module.exports = CitationsShortcode;
