/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, NunjucksShortcode } = require("greenfedora-utils");

/**
 * Video link shortcode class.
 */
class VideoLinkShortcode extends NunjucksShortcode
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
        let bc = this.config.getBaseConfig();
        if (bc.lazyload) {
            if (kwargs.class) {
                kwargs.class += ' lazyload cf';
            } else {
                kwargs.class = 'lazyload cf';
            }
            kwargs.loading = 'lazy';
        }
        return kwargs;
    }

    /**
     * Get src name.
     * 
     * @return  {string}
     */
    getSrcName()
    {
        let bc = this.config.getBaseConfig();
        let srcName = 'src';
        if (bc.lazyload) {
            //srcName = 'data-src';
        }

        return srcName;
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
        let ctx = context.ctx;
        if (ctx.isRss) {
            syslog.warning(`Detected RSS with ${context.ctx.permalink}.`);
        }

        let type = args[0];
        let kwargs = args[1] || {};

        if (!type || 'string' != typeof type) {
            syslog.error(`Video links need the type as the first parameter: ${context.ctx.permalink}.`);
            return '';
        }

        if (!kwargs.id && !kwargs.src) {
            syslog.error(`Video links require either and 'id' or a 'src' parameter: ${context.ctx.permalink}.`);
        }

        let srcName = this.getSrcName();
        kwargs = this.configureLazyClass(kwargs);

        if (!kwargs.class) {
            kwargs['class'] = '';
        }

        kwargs.class += " aspect-ratio--object";


        let ret = '';
        if ('youtube' == type) {

            let id;
            if (kwargs.id) {
                if (kwargs.cook) {
                    kwargs.src = "https://www.youtube.com/embed/" + kwargs.id;
                    delete kwargs.cook;
                } else {
                    kwargs.src = "https://www.youtube-nocookie.com/embed/" + kwargs.id;
                }
                id = kwargs.id;
                delete kwargs.id;
            } else {
                syslog.error(`Video links for YouTube require the 'id' parameter: ${context.ctx.permalink}.`);
            }

            if (!kwargs.description && kwargs.caption) {
                kwargs.description = kwargs.caption;
            }

            let meta = {};
            for (let item of ['description', 'name', 'uploadDate']) {
                if (kwargs[item]) {
                    if ('uploadDate' == item) {
                        let d = new Date(kwargs[item]);
                        meta[item] = d.toISOString();
                    } else {
                        meta[item] = kwargs[item];
                    }
                    delete kwargs[item];
                } else {
                    if (this.config.getbaseData().schemaWarnings) {
                        syslog.warning(`YouTube video links should have the '${item}' parameter: ${context.ctx.permalink}.`);
                    }
                }
            }

            ret += `<figure class="videolink aspect-ratio aspect-ratio--16x9">`
            ret += `<iframe frameborder="0" width="560" height="315" title="YouTube video player"`
            for (let idx in kwargs) {
                if (!idx.startsWith('__')) {
                    if ('src' == idx) {
                        ret += ` ${srcName}="${kwargs[idx]}"`;
                    } else {
                        ret += ` ${idx}="${kwargs[idx]}"`;
                    }
                }
            }
            ret += ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="">';
            ret += '</iframe>';
            if (kwargs.caption) {
                ret += '<figcaption>' + kwargs.caption + '</figcaption>';
            }
            ret += '</figure>';

            let url = kwargs.src;
            delete kwargs.src;
            delete kwargs.class;

            let saveData = {
                embedUrl: url,
                contentUrl: `https://www.youtube-nocookie.com/watch?v=${id}`,
                thumbnailUrl: `https://img.youtube-nocookie.com/vi/${id}/default.jpg`
            }

            if (kwargs.caption) {
                saveData.caption = kwargs.caption;
            }

            for (let idx in meta) {
                if (!idx.startsWith('__')) {
                    saveData[idx] = meta[idx];
                }
            }

            this.config.videoInfoStore.addBySrcAndPage(url, context.ctx.permalink, saveData);


        } else if ('bbc' === type) {

            let id;
            let imgid;
            if (kwargs.id) {
                if (-1 !== kwargs.id.indexOf('/')) {
                    let sp = kwargs.id.split('/');
                    imgid = sp[0];
                    id = sp[1];
                }
                kwargs.src = "https://www.bbc.co.uk/{sect}/av-embeds/" + id;
                delete kwargs.id;
            } else {
                syslog.error(`Video links for BBC require the 'id' parameter: ${context.ctx.permalink}.`);
            }

            if (!kwargs.description && kwargs.caption) {
                kwargs.description = kwargs.caption;
            }

            if (kwargs.section) {
                kwargs.src = kwargs.src.replace('{sect}', kwargs.section);
            }

            let meta = {};
            for (let item of ['description', 'name', 'uploadDate']) {
                if (kwargs[item]) {
                    if ('uploadDate' == item) {
                        let d = new Date(kwargs[item]);
                        meta[item] = d.toISOString();
                    } else {
                        meta[item] = kwargs[item];
                    }
                    delete kwargs[item];
                } else {
                    if (this.config.getbaseData().schemaWarnings) {
                        syslog.warning(`BBC video links should have the '${item}' parameter: ${context.ctx.permalink}.`);
                    }
                }
            }

            ret += `<figure class="videolink aspect-ratio aspect-ratio--16x9">`
            ret += `<iframe frameborder="0"`
            for (let idx in kwargs) {
                if (!idx.startsWith('__')) {
                    if ('src' == idx) {
                        ret += ` ${srcName}="${kwargs[idx]}"`;
                    } else {
                        ret += ` ${idx}="${kwargs[idx]}"`;
                    }
                }
            }
            ret += ' allowfullscreen>';
            ret += '</iframe>';
            if (kwargs.caption) {
                ret += '<figcaption>' + kwargs.caption + '</figcaption>';
            }
            ret += '</figure>';

            let url = kwargs.src;
            delete kwargs.src;
            delete kwargs.class;

            let saveData = {
                embedUrl: url,
                contentUrl: kwargs.url,
                thumbnailUrl: `https://ichef.bbci.co.uk/images/ic/688xn/${imgid}.jpg`
            }

            if (kwargs.caption) {
                saveData.caption = kwargs.caption;
            }


            for (let idx in meta) {
                if (!idx.startsWith('__')) {
                    saveData[idx] = meta[idx];
                }
            }

            this.config.videoInfoStore.addBySrcAndPage(url, context.ctx.permalink, saveData);


        } else {
            syslog.error(`'${type}' is an unsupported video link type: ${context.ctx.permalink}.`);
        } 

        return ret;



        /*
        <iframe width="560" height="315" src="https://www.youtube.com/embed/eF551z9KlA8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        */
    }
}

module.exports = VideoLinkShortcode;
