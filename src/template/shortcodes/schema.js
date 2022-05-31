/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog, GfString } = require("greenfedora-utils");
const { URL } = require('url');
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

        let imgUrls = this.config.imageInfoStore.getByPage(pl);

        //let imageSchema = [];
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
            debug(`Imageurls is null for permalink: ${pl}`);
        }


        if (imageIds.length > 0) {
            for (let item of schemaDefs.addImagesTo) {
                if (schstruct[item]) {
                    schstruct[item].image = imageIds;
                }
            }
        }

        //syslog.inspect(imageSchema);

        for (let idx in schstruct) {
            let curr = schstruct[idx];
            if (!curr["@id"]) {
                curr["@id"] = "/#" + idx;
            }
            json["@graph"].push(curr);
        }

        let ret = `
            <script type="application/ld+json">
            ${JSON.stringify(json, undefined, 3)}
            </script>
        `;

        return ret;
    }
}

module.exports = SchemaShortcode;
