/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const footnotes = require('../template/processors/showdown/showdownFootnotes');

module.exports = function(config) {

    return {

        // Locations.
        locations: {
            layouts: '_layouts',
            data: '_data',
            cache: '_cache',
            copy: '_copy',
            assets: 'assets'
        },

        // Default template processor configs.
        defaultTemplateProcessors: {
            markdoc: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: true},
                    extractFromFm: ['content', 'excerpt', 'leader'],
                    compileFields: ['content', 'excerpt', 'leader'],
                    layoutTemplateProcessor: 'nunjucks',
                    computedTemplateProcessor: 'nunjucks'
                },
                engineOptions: {
                    extensions: [footnotes],
                    strikethrough: true,
                    tables: true
                },
                exts: ['md', 'markdown'],
            },
            markdown: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: true},
                    extractFromFm: ['content', 'excerpt', 'leader'],
                    compileFields: ['content', 'excerpt', 'leader'],
                    layoutTemplateProcessor: 'nunjucks',
                    computedTemplateProcessor: 'nunjucks'
                },
                engineOptions: {
                    extensions: [footnotes],
                    strikethrough: true,
                    tables: true
                },
                exts: ['md', 'markdown'],
            },
            nunjucks: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: false},
                    extractFromFm: ['content'],
                    usePrecompiledTemplates: false,
                    layoutTemplateProcessor: 'nunjucks',
                    computedTemplateProcessor: 'nunjucks'
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
                    'assets/_generatedImages/**',
                    '_*/**'
                ],
                onlyFiles: true
            }
        },

        // Some flags.
        useMarkdoc: false,
        lazyload: true,
        figureClass: 'respimg',
        buldSeparateRssContent: true,
        type: 'page',
        livereload: true,

        // Default collections.
        collectionsToTrack: ['type', 'tags'],

        // Parts of permalink to ignore.
        permalinkIgnoreParts: ["^\\d{4}-\\d{2}-\\d{2}-"],

        // Suitable defaults.
        computed: {
            permalink: "{{fbase}}"
        } 
    };

}
