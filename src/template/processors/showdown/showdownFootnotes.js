/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

/**
 * NB. This is taken from an older plugin at https://github.com/halbgut/showdown-footnotes
 *  which is no longer maintained and fails audid=t tests on NPM.
 */

const converter = new (require('showdown').Converter)()

module.exports = () => [
    {
        type: 'lang',
        filter: text => text.replace(
        /^\[\^([\d\w]+)\]:\s*((\n+(\s{2,4}|\t).+)+)$/mg,
        (str, name, rawContent, _, padding) => {
            const content = converter.makeHtml(rawContent.replace(new RegExp(`^${padding}`, 'gm'), ''))
            return `<div class="footnote" id="footnote-${name}"><a href="#footnote-${name}"><sup>[${name}]</sup></a>:${content}</div>`
        })
    },
    {
        type: 'lang',
        filter: text => text.replace(
        /^\[\^([\d\w]+)\]:( |\n)((.+\n)*.+)$/mg,
        (str, name, _, content) =>
            `<small class="footnote" id="footnote-${name}"><a href="#footnote-${name}"><sup>[${name}]</sup></a>: ${content}</small>`
        )
    },
    {
        type: 'lang',
        filter: text => text.replace(
        /\[\^([\d\w]+)\]/m,
        (str, name) => `<a href="#footnote-${name}"><sup>[${name}]</sup></a>`
        )
    }
]