/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

module.exports = Object.freeze({
    /** Control file name. @constant {string} */
    CONTROL_FILE_NAME: '.grnfdr.js',

    /** Events. @constant {string[]} */
    EVENTS: [
        'CONFIG_LOADED_GLOBALDATAFILES',
        'CONFIG_LOAD_FINISHED',
        'INIT_FINISHED',
        'AFTER_PROCESS_ASSETS',
        'AFTER_PROCESS_SINGLE_TEMPLATE',
        'BEFORE_RENDER_SINGLE_TEMPLATE',
        'AFTER_RENDER_SINGLE_TEMPLATE',
        'RENDER_FINISHED'
    ]
});

