/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, GfString } = require("greenfedora-utils");
const { URL } = require('url');
const Breadcrumb = require('./breadcrumb');
const path = require('path');
const debug = require("debug")("GreenFedora:Plugin:SchemaShortcode");

/**
 * Schema shortcode class.
 */
class SchemaShortcode extends NunjucksShortcode
{
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
        let json = {
            "@context": "https://schema.org",
            "@graph": []
        }

        let schstruct = args[0];

        let ctx = context.ctx;
        let pl = ctx.permalink;

        let schemaDefs = ctx.schemaDefs;

        // Citation?

        if (ctx.citation) {
            let citationSchema = [];
            let toProcess;
            if (!Array.isArray(ctx.citation)) {
                toProcess = [ctx.citation];
            } else {
                toProcess = ctx.citation;
            }

            for (let item of toProcess) {
                let schcurr = {
                    "@type": "WebPage"
                }

                if (item.title) {
                    schcurr.name = item.title;
                    schcurr.headline = item.title;
                } else if (this.config.getBaseData().schemaWarnings) {
                    syslog.warning(`Citations should have a 'title', processing ${ctx.relPath}.`);
                }

                if (item.url) {
                    schcurr.url = item.url;
                } else if (ctx.externalLink) {
                    schcurr.url = ctx.externalLink;
                } else if (this.config.getBaseData().schemaWarnings) {
                    syslog.warning(`Citations should have a 'url' or 'externalLink' should be specified, processing ${ctx.relPath}.`);
                }

                if (item.author) {
                    let author = {
                        "@type": "Person"
                    }
                    for (let f in item.author) {
                        author[f] = item.author[f];
                    }
                    schcurr.author = author;
                }
                if (item.site) {
                    let site = {
                        "@type": "Organization"
                    }
                    for (let f in item.site) {
                        site[f] = item.site[f];
                    }
                    schcurr.publisher = site;
                }

                citationSchema.push(schcurr);
            }

            if (schstruct.article) {
                schstruct.article.citation = citationSchema;
            }
        }

        // Images.

        let imgUrls = this.config.imageInfoStore.getByPage(pl);

        let imageIds = [];
        let phWidth = this.config.getGlobalData('imageConfig').options.placeholderWidth;

        if (null !== imgUrls) {
            for (let item of Object.keys(imgUrls)) {
                for (let type of Object.keys(imgUrls[item])) {
                    for (let idx of Object.keys(imgUrls[item][type].files)) {
                        let file = imgUrls[item][type].files[idx];
                        if (phWidth !== file.width) {
                            let u = (new URL(file.file, context.ctx.hostname)).toString();   
                            let slug = '/#image-' + GfString.slugify(file.file);          
                            let ns = {
                                "@type": "ImageObject",
                                "@id": `${slug}`,
                                contentUrl: `${u}`,
                                url: `${u}`,
                                width: file.width,
                                height: file.height
                            }
                            schstruct[slug] = ns;
                            imageIds.push({"@id": slug});
                        }
                    }
                }
            }
        } else {
            debug(`Imageurls is null for permalink: ${pl}. Will use default image.`);
            if (ctx.site.defaultArticleImage) {
                if (this.config.imageInfoStore.hasBySrc(ctx.site.defaultArticleImage)) {
                    let defImg = this.config.imageInfoStore.getBySrc(ctx.site.defaultArticleImage);
                    for (let type of Object.keys(defImg)) {
                        for (let idx of Object.keys(defImg[type].files)) {
                            let file = defImg[type].files[idx];
                            if (phWidth !== file.width) {
                                let u = (new URL(file.file, context.ctx.hostname)).toString();   
                                let slug = '/#image-' + GfString.slugify(file.file);          
                                let ns = {
                                    "@type": "ImageObject",
                                    "@id": `${slug}`,
                                    contentUrl: `${u}`,
                                    url: `${u}`,
                                    width: file.width,
                                    height: file.height
                                }
                                schstruct[slug] = ns;
                                imageIds.push({"@id": slug});
                            }
                        }
                    }
                } else {
                    syslog.inspect(Object.keys(this.config.imageInfoStore.store.bySrc), "Schema");
                    syslog.warning(`Could not find default article image: ${ctx.site.defaultArticleImage}`);
                }
            }
        }

        if (imageIds.length > 0) {
            for (let item of schemaDefs.addImagesTo) {
                if (schstruct[item]) {
                    schstruct[item].image = imageIds;
                }
            }
        }

        // Videos.

        let videoUrls = this.config.videoInfoStore.getByPage(pl);

        let videoIds = [];

        if (null !== videoUrls) {
            for (let item of Object.keys(videoUrls)) {

                let itemData = videoUrls[item]
                //syslog.inspect(itemData);

                let slug = '/#video-' + GfString.slugify(itemData.embedUrl);          
                let ns = {
                    "@type": "VideoObject",
                    "@id": `${slug}`,
                }

                for (let spec in itemData) {
                    ns[spec] = itemData[spec];
                }

                schstruct[slug] = ns;
                videoIds.push({"@id": slug});

            }
        } else {
            debug(`Videourls is null for permalink: ${pl}`);
        }

        if (videoIds.length > 0) {
            for (let item of schemaDefs.addVideosTo) {
                if (schstruct[item]) {
                    schstruct[item].video = videoIds;
                }
            }
        }

        // Breadcrumbs.
        if (context.ctx.breadcrumb) {
            let brcr = {
                "@type": "BreadcrumbList",
                itemListElement: []
            }

            let items = [];

            let count = 0;
            for (let item of context.ctx.breadcrumb) {
                let data;
                if (item.loc) {
                    data = Breadcrumb.locationParse(item.loc, context.ctx);
                } else {
                    data = item;
                }

                let single = {
                    "@type": "ListItem",
                    position: count + 1,
                    name: data.title
                }

                if (count < context.ctx.breadcrumb.length - 1) {
                    single.item = {
                        "@type": "WebPage",
                        "@id": data.url

                    }
                }

                items.push(single);
            }

            brcr.itemListElement = items;

            if (schstruct.webpage) {
                schstruct.webpage.breadcrumb = brcr;
            }
        }

        // Product warnings?
        if (schstruct.product && this.config.getBaseConfig().schemaWarnings) {
            let product = schstruct.product;
            let type = product["@type"];
            if (type === "Movie") {
                for (let chk of ['image', 'dateCreated', 'director']) {
                    if (!product[chk]) {
                        syslog.warning(`Google will complain if you don't specify '${chk}' on ${type} schema: ${context.ctx.relPath}`);
                    }
                }
            }
        }

        // Global data we've saved.
        let relPath = context.ctx.relPath;
        if (this.config.hasGlobalData('schema')) {
            let idx = 'article';
            let gd = this.config.getGlobalData('schema');
            if (relPath in gd) {
                if (gd[relPath].howto) {
                    schstruct[idx] = gd[relPath].howto;
                    schstruct[idx]['@type'] = "HowTo";
                    schstruct[idx].mainEntityOfPage = {"@id": "/#webpage"}
                    schstruct[idx].step = [];
                
                    if (gd[relPath].howtostep) {
                        let count = 1;
                        for (let step of gd[relPath].howtostep) {
                            step['@type'] = "HowToStep";
                            step.url = path.join('/', context.ctx.permalink, '/#step-' + count);
                            schstruct[idx].step.push(step);
                            count++;
                        }
                    } else {
                        syslog.error(`No HowToSteps found for HowTo in ${relPath}`)
                    }
                }
                if (gd[relPath].faqpage) {
                    /*
                    let idx1 = 'faqpage';
                    schstruct[idx1] = {
                        '@type': "FAQPage",
                        name: gd[relPath].faqpage.name,
                        mainEntity: []
                    }
                    */

                    if (gd[relPath].faqqa) {
                        if (!schstruct.webpage.mainEntity) {
                            schstruct.webpage.mainEntity = [];
                        }
                        let count = 1;
                        for (let step of gd[relPath].faqqa) {
                            let ops = {
                                '@type': 'Question',
                                url: path.join('/', context.ctx.permalink, '/#faq-' + count),
                                name: step.q,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: step.text
                                }
                            }
                            schstruct.webpage.mainEntity.push(ops);
                            count++;
                        }
                    } else {
                        syslog.error(`No FaqQas found for FaqPage in ${relPath}`)
                    }

                }
                    
            }
        }

        // Output.

        for (let idx in schstruct) {
            let curr = schstruct[idx];
            if (!curr["@id"]) {
                curr["@id"] = "/#" + idx;
            }
            json["@graph"].push(curr);
        }

        let ret = `
<script type="application/ld+json">\n
${JSON.stringify(json, undefined, 3)}\n
</script>
        `;

        return ret;
    }
}

module.exports = SchemaShortcode;
