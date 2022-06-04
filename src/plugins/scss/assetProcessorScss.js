/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const sass = require('sass');
const postcss = require('postcss');
const { GfError, syslog, AssetProcessor } = require('greenfedora-utils');
const path = require('path');
const fs = require('fs');
const debug = require("debug")("GreenFedora:Plugin:AssetProcessorScss");

// Local error.
class GfAssetProcessorScssError extends GfError {};

/**
 * Asset processing for SCSS/SASS.
 */
class AssetProcessorScss extends AssetProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Config.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {AssetProcessorScss}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);
        debug(`Loaded SCSS asset processor.`);
    }

    /**
     * Process a file.
     * 
     * @param   {string}    filePath    File to process.
     * 
     * @return  {boolean}
     */
    process(filePath)
    {
        let relPath = filePath.replace(this.config.sitePath, '');
        let baseName = path.basename(relPath, path.extname(relPath));

        if (baseName.startsWith(this.options.ignoreFileStart)) {
            debug(`Ignoring SCSS file ${relPath} because it matches the start ignore.`);
            return false;
        }

        let opRel = path.join(this.options.outputDir, baseName + this.options.outputExt);
        let op = path.join(this.config.outputPath, opRel);

        debug(`Processing SCSS asset ${relPath} => ${op}`);

        let engineOptions = {...this.engineOptions};
        engineOptions.file = filePath;
        engineOptions.outFile = op;

        // Compile the SCSS.
        let compiled;
        try {
            compiled = sass.renderSync(engineOptions);
        } catch (err) {
            throw new GfAssetProcessorScssError(`Unable to process SCSS for ${relPath}.`, null, err);
        }

        // Any postcss?
        if (this.options.postcss) {

            let postcssEngineOptions = {...this.options.postcss.engineOptions};
            let modules = this.options.postcss.modules;

            let data;
            postcss(modules).process(compiled.css, postcssEngineOptions).then((result) => {
                result.warnings().forEach((warn) => {
                    syslog.warning(warn.toString())
                });
                debug(`Autoprefixing CSS for: ${relPath}.`);
                data = result.css;
                return data;
            }).then((data) => {
                compiled.css = data;
            })    
        }

        // Write the file out.
        if (!fs.existsSync(path.dirname(op))) {
            fs.mkdirSync(path.dirname(op), { recursive: true });
        }
        fs.writeFileSync(op, compiled.css.toString());

        syslog.info(`Processed SCSS asset: ${relPath}`)

        return true;
    }

}

module.exports = AssetProcessorScss;