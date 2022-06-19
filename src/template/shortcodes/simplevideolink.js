/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require("greenfedora-utils");
const VideoLinkShortcode = require('./videolink');

/**
 * Simple video link shortcode class.
 */
class SimpleVideoLinkShortcode extends VideoLinkShortcode
{
    /**
     * Configure lazyload class.
     * 
     * @param   {object}    kwargs
     * 
     * @return  {string}
     */
    configureLazyClass(kwargs)
    {
        return kwargs;
    }

    /**
     * Get src name.
     * 
     * @return  {string}
     */
    getSrcName()
    {
        return 'src';
    }

}

module.exports = SimpleVideoLinkShortcode;
