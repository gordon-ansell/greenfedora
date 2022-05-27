/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { Preprocessor, GfError, GfPath } = require('GreenFedora-Utils');
const debug = require("debug")("GreenFedora:PreprocessorImage");

// Local error.
class GfPreprocessorImageError extends GfError {};

/**
 * Preprocess images.
 */
class PreprocessorImage extends Preprocessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config      Configs.
     * 
     * @return  {PreprocessorImage}
     */
    constructor(config)
    {
        super('image', config);
    }

    /**
     * Preprocess a string.
     * 
     * @param   {string}    content     Content to preprocess.
     * @param   {string}    filePath    File path.
     * @param   {boolean}   [rss=false] For RSS?
     * 
     * @return  {string}
     */
    preprocessString(content, filePath, rss = false)
    {
        debug(`Preprocessing images for ${filePath}`);

        let ret = content;
        const regex = /!\[([^\]]*)\]\((.*?)\s*("(?:.*[^"])")?\s*\)/g;
        let m;
        while ((m = regex.exec(content)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (m) {
                let alt = m[1].trim();

                let url;
                if (!m[2].trim().startsWith('/')) {
                    let fp = GfPath.removeLastSeg(filePath.trim().replace(this.config.sitePath, ''));
                    url = path.join(fp, m[2].trim());
                } else {
                    url = path.resolve(m[2].trim()).replace(this.config.sitePath, '');
                }

                let title;
                if (m[3]) {
                    title = m[3].trim();
                }
                let rep;
                if (rss) {
                    rep = `{% simpleimg "${url}", rss=true`;
                } else {
                    rep = `{% img "${url}"`;
                }
                if (alt) {
                    rep += `, alt="${alt}"`;
                }
                if (title) {
                    if ('"' == title[0]) title = title.substring(1);
                    if ('"' == title[title.length - 1]) title = title.substring(0, title.length - 1);

                    if (title.includes('|')) {
                        let sp = title.split('|');
                        for (let part of sp) {
                            if (!part.includes('=')) {
                                throw new GfPreprocessorImageError(`Incorrect enhanced image title. Fields must be in the format name=value (yours is ${part}).`);
                            }
                            let div = part.split('=');
                            rep += `, ${div[0].trim()}="${div[1].trim()}"`;
                        }
                    } else if (title.includes('=')) {
                        let div = title.split('=');
                        rep += `, ${div[0].trim()}="${div[1].trim()}"`;
                    } else {
                        rep += `, title="${title}"`;
                    }
                }
                rep += ` %}`;
                ret = ret.replace(m[0], rep);
            }
        }

        return ret;
    }
}

module.exports = PreprocessorImage;