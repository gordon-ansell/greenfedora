/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { NunjucksShortcode, syslog } = require("greenfedora-utils");

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

        //syslog.inspect(args[0]);
        
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
