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
            temp: '_temp',
            assets: 'assets',
            site: '_site'
        },

        // Default template processor configs.
        defaultTemplateProcessors: {
            markdoc: {
                options: {
                    parseFrontMatter: true,
                    fmParseOptions: {excerpt: true},
                    extractFromFm: ['content', 'leader'],
                    compileFields: ['content', 'leader'],
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
                    fmParseOptions: {excerpt: false},
                    extractFromFm: ['content', 'leader'],
                    compileFields: ['content', 'leader'],
                    preCompileTemplateProcessor: 'nunjucks',
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

        // File system parser for the watcher.
        fsParserWatcher: {
            options: {
                ignore: [
                    'node_modules/**',
                    'package.json',
                    'package-lock.json',
                    'sh-*',
                    'assets/_generatedImages/**',
                    '_cache/**',
                    '_copy/**',
                    '_site/**',
                    '_temp/**'
                ],
                onlyFiles: true
            }
        },

        // Some flags.
        useMarkdoc: false,
        lazyload: true,
        figureClass: 'respimg',
        buildSeparateRssContent: true,
        type: 'page',
        livereload: true,
        schemaWarnings: true,
        allowInlinePosts: true,
        mainCssFiles: ['assets/style/local.scss'],
        draft: false,

        // Schema definitions.
        schemaDefs: {
            addImagesTo: ['webpage', 'article', 'product'],
            addVideosTo: ['webpage', 'article', 'product']
        },

        // Default collections.
        collectionsToTrack: ['type', 'tags'],

        // Parts of permalink to ignore.
        permalinkIgnoreParts: ["^\\d{4}-\\d{2}-\\d{2}-"],

        // Suitable defaults.
        breadcrumbUsesTags: 1,
        breadcrumb: [
            {
                loc: "home",
            },
            {
                loc: "self"
            }
        ],
        computed: {
            permalink: "{{fbase}}"
        } 
    };

}
