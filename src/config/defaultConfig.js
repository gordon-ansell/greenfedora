/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const footnotes = require('../template/processors/showdown/showdownFootnotes');

module.exports = function(userConfig) {

    return {
        // For testing purposes.
        _test_thisconfig_is: "Default Config",

        // Locations.
        locations: {
            layouts: '_layouts',
            data: '_data',
            cache: '_cache',
            copy: '_copy'
        },

        // Default template processor configs.
        defaultTemplateProcessors: {
            markdown: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: true},
                    extractFromFm: ['content', 'excerpt', 'leader'],
                    compileFields: ['content', 'excerpt', 'leader'],
                    layoutTemplateProcessor: 'nunjucks'
                },
                engineOptions: {
                    extensions: [footnotes],
                    strikethrough: true,
                    tables: true
                },
                exts: ['md', 'markdown']
            },
            nunjucks: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: false},
                    extractFromFm: ['content'],
                    usePrecompiledTemplates: true
                },
                engineOptions: {
                    autoescape: false, 
                    throwOnUndefined: true, 
                    lstripBlocks: true, 
                    trimBlocks: true
                },
                exts: ['njk']
            }
        },

        // Default asset processor configs.
        defaultAssetProcessors: {
            scss: {
                options: {
                },
                engineOptions: {
                },
                exts: ['scss']
            },
            image: {
                options: {
                },
                engineOptions: {
                },
                exts: ['jpeg', 'jpg', 'png', 'gif', 'webp']
            },
        },

        // File system parser.
        fsParser: {
            options: {
                ignore: [
                    'node_modules/**',
                    'package.json',
                    'package-lock.json',
                    'sh-*',
                    '_*/**'
                ],
                onlyFiles: true
            }
        } 
    };

}
