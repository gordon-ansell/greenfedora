/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { Preprocessor, GfError, syslog } = require('GreenFedora-Utils');
const debug = require("debug")("GreenFedora:PreprocessorComment");

// Local error.
class GfPreprocessorCommentError extends GfError {};

/**
 * Preprocess comments.
 */
class PreprocessorComment extends Preprocessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config      Configs.
     * 
     * @return  {PreprocessorComment}
     */
    constructor(config)
    {
        super('comment', config);
    }

    /**
     * Preprocess a string.
     * 
     * @param   {string}    content     Content to preprocess.
     * @param   {string}    permalink   Permalink for post.
     * @param   {boolean}   [rss=false] For RSS?
     * 
     * @return  {string}
     */
    preprocessString(content, filePath, rss = false)
    {
        debug(`Preprocessing comments for ${filePath}`);

        let ret = content;
        const regex = /\[\/\/\]\:\s\#\s\(\@(.*)\)/g;
        let m;
        while ((m = regex.exec(content)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (m) {
                let rep = '';

                let cmds = m[1].trim();
                if (cmds.includes('|')) {

                    let sp = cmds.split('|');
                    let count = 0;
                    for (let item of sp) {

                        if (0 == count) {
                            rep += item.trim();
                        } else if (item.includes('=')) {
                            let parts = item.split('=');
                            if ('' != rep) {
                                if (1 == count) {
                                    rep += ' '
                                } else {
                                    rep += ', ';
                                }
                            }
                            rep += `${parts[0].trim()}="${parts[1].trim()}"`
                        } else {
                            if ('' != rep) {
                                if (1 == count) {
                                    rep += ' ';
                                } else {
                                    rep += ', ';
                                }
                            }
                            rep += '"' + item.trim() + '"';
                        }

                        count++;
                    }

                } else {
                    rep += cmds;
                }

                if (rep.trim().startsWith('videolink') && rss) {
                    rep = rep.replace('videolink', 'simplevideolink');
                }

                rep = '{% ' + rep + ' %}';

                ret = ret.replace(m[0], rep);
            } else {
                syslog.inspect(m, "Output from PreprocessorComment (standard)");
            } 
        }

        // Raw.
        const regexRaw = /\[\/\/\]\:\s\#\s\(\-(.*)\)/g
        while ((m = regexRaw.exec(ret)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (m) {

                if ('@' == m[1][0]) {
                    let rep = '[//]: (' + m[1] + ')';
                    ret = ret.replace(m[0], rep);
                }
            } else {
                syslog.inspect(m, "Output from PreprocessorComment (raw)");
            } 
        }

 
        //syslog.warning(ret);
        return ret;
    }
}

module.exports = PreprocessorComment;