/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, GfError, syslog } = require('greenfedora-utils');

class GfRatingStarsShortcodeError extends GfError {}


/**
 * Rating stars shortcode class.
 */
class RatingStarsShortcode extends NunjucksShortcode
{
    /**
     * Get the CSS.
     * 
     * @param   {string}    id      Block ID.
     * @param   {number}    size    Size in pixels.
     * @param   {string}    fg      Star foreground colour.
     * @param   {string}    bg      Star background colour.
     * 
     * @return  {string} 
     */
    getCss(id, size, fg, bg)
    {
        let ret = `
            :root {
                --star-size-${id}: ${size}px;
                --star-color-${id}: ${fg};
                --star-background-${id}: ${bg};
            }
            
            #rating-stars-${id} {
                position: relative;
                box-sizing: border-box;
            
                display: inline-block;
                font-size: var(--star-size-${id});
                font-family: Times; // make sure ★ appears correctly
                line-height: 1;
            
            }
            
            #rating-stars-${id}::before {
                --percent: calc((var(--rating-${id}) / 5) * 100%);
                content: '★★★★★';
                letter-spacing: 3px;
                background: linear-gradient(90deg, var(--star-background-${id}) var(--percent), var(--star-color-${id}) var(--percent));
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
    `

        return ret;
    }

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
        let rating = args[0];
        let kwargs = args[1] || {}

        if (!kwargs.size) {
            kwargs.size = 60;
        }

        if (!kwargs.fg) {
            kwargs.fg = 'var(--col-secondary-text)';
        }

        if (!kwargs.bg) {
            kwargs.bg = '#fc0';
        }

        let r = (Math.random() + 1).toString(36).substring(2);

        let html = '<style>' + this.getCss(r, kwargs.size, kwargs.fg, kwargs.bg) + '</style>';
        html += `<div id="rating-stars-${r}" style="--rating-${r}: ${rating};" title="Rating: ${rating}/5" aria-label="Rating of this product is ${rating} out of 5."></div>`;

        //this.config.addInlineCss('rating-stars-' + r, this.getCss(r, kwargs.size, kwargs.fg, kwargs.bg));

        return html;
    }

}

module.exports = RatingStarsShortcode;
  