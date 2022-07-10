/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, syslog, AssetProcessor, FsUtils, GfPath } = require('greenfedora-utils');
const path = require('path');
const fs = require('fs');
const imageSize = require('image-size');
const sharp = require('sharp');
const debug = require("debug")("GreenFedora:Plugin:AssetProcessorImage");

// Local error.
class GfAssetProcessorImageError extends GfError {};

/**
 * Asset processing for images.
 */
class AssetProcessorImage extends AssetProcessor
{
    /**
     * Constructor.
     * 
     * @param   {Config}    config              Config.
     * @param   {object}    [options={}]        Options.
     * @param   {object}    [engineOptions={}]  Engine options.
     * 
     * @return  {AssetProcessorImage}
     */
    constructor(config, options = {}, engineOptions = {})
    {
        super(config, options, engineOptions);
        debug(`Loaded image asset processor.`);
        this.loadGenerated();
    }

    /**
     * Load the generated store.
     * 
     * @return  {AssetProcessorImage}
     */
    loadGenerated()
    {
        if (this.options.generatedStorePath) {
            if (fs.existsSync(this.options.generatedStorePath)) {
                debug(`Loading generated images from: ${this.options.generatedStorePath}`);
                let serialised = fs.readFileSync(this.options.generatedStorePath, 'utf8');
                this.options.generated = new Map(JSON.parse(serialised));
            }
        }
        return this;
    }

    /**
     * Save the generated store.
     * 
     * @return  {AssetProcessorImage}
     */
    saveGenerated()
    {
        if (this.options.generatedStorePath) {
            let serialised = JSON.stringify(Array.from(this.options.generated.entries()));
            debug(`Saving generated images to: ${this.options.generatedStorePath}`);
            fs.writeFileSync(this.options.generatedStorePath, serialised, 'utf8');
        } else {
            syslog.error(`There is no image store path defined: ${this.options.generatedStorePath}`);
        }
        return this;
    }

    /**
     * Get the mime type for a given extension.
     * 
     * @param   {string}    ext     Extension.
     * 
     * @return  {string}
     * 
     * @throws  {GfAssetProcessorImageError}
     */
    getMime(ext)
    {
        if (!this.options.mimes[ext]) {
            throw new GfAssetProcessorImageError(`No corresponding mime type found for image with extension '${ext}'.`)
        }
        return this.options.mimes[ext];
    }

    /**
     * Calculate the new sise to maintain aspect ratio.
     * 
     * @param   {number}    srcWidth        Image width
     * @param   {number}    srcHeight       Image height
     * @param   {boolean}   allowUpscale    Allow sizing upwards?
     * @param   {number}    maxWidth        Max width
     * @param   {number}    maxHeight       Max height
     * 
     * @return  {number[]}
     */
    aspectResize(srcWidth, srcHeight, allowUpscale = false, maxWidth = 1280, maxHeight = 720)
    {
        let resizeWidth  = srcWidth;
        let resizeHeight = srcHeight;
  
        let aspect = resizeWidth / resizeHeight;
        let scaleX = maxWidth / srcWidth;
        let scaleY = maxHeight / srcHeight;
        let scale  = Math.min(scaleX, scaleY);
  
        resizeWidth *= scale;
        resizeHeight *= scale;
  
        if (resizeWidth > maxWidth) {
            resizeWidth  = maxWidth;
            resizeHeight = resizeWidth / aspect;
        }
  
        if (resizeHeight > maxHeight) {
            aspect       = resizeWidth / resizeHeight;
            resizeHeight = maxHeight;
            resizeWidth  = resizeHeight * aspect;
        }

        if (!allowUpscale) {
            if (resizeWidth > srcWidth) {
                resizeWidth = srcWidth;
                resizeHeight = resizeWidth / aspect;
            }

            if (resizeHeight > srcHeight) {
                aspect = resizeWidth / resizeHeight;
                resizeHeight = srcHeight;
                resizeWidth = resizeHeight * aspect;
            }
        }
  
        return [
            Math.round(resizeWidth),
            Math.round(resizeHeight)
        ];
    }

    /**
     * Resize an image.
     * 
     * @param   {string}    src             Filepath to source image.
     * @param   {number}    requiredWidth   Width wanted.
     * @param   {string}    requiredFormat  Format required.
     * @param   {string}    outputPath      Output path.
     * 
     * @return  {number}                    Height of generated image.
     */
    async resizeImage(src, requiredWidth, requiredFormat, outputPath)
    {
        // Construct sharp.
        let sharper = sharp(src, this.engineOptions.constructorOptions);

        // Resize image.
        sharper.resize({width: requiredWidth});

        // To a particular format.
        sharper.toFormat(requiredFormat, this.engineOptions.imageTypeOptions[requiredFormat]);

        // Make the directory.
        FsUtils.mkDirRecurse(path.dirname(outputPath));

        //if (this.config.processArgs.argv.dryrun) {
        //    debug(`Write: %s`, outputPath.replace(this.config.sitePath, ''));
        //    return 0;
        //} else {
            return await sharper.toFile(outputPath).then(info => {
                debug(`Wrote image file: ${outputPath.replace(this.config.sitePath, '')}`);
                return info.height;
            })
            .catch(err => {
                syslog.error(`Failed to create ${outputPath}: ${err.message}.`);
            });
        //}

    }
 
    /**
     * Process a file.
     * 
     * @param   {string}    filePath    Path to file to process.
     * @param   {boolean}   skip        Skip processing?
     * @param   {boolean}   silent      Silent processing?
     * 
     * @return
     * 
     * @throws  {GfAssetProcessorImageError}
     */
    async process(filePath, skip = false, silent = false)
    {
        filePath = GfPath.addLeadingSlash(filePath);
        debug(`Processing image: ${filePath}`);

        // Grab the options.
        //let options = this.options;
        let options = this.config.getGlobalData('imageConfig').options;

        if (options.placeholderWidth && (!options.widths.includes(options.placeholderWidth))) {
            options.widths.push(options.placeholderWidth);
        }

        // Extract bits of the sourse path.
        let absPath = filePath;
        let relPath = GfPath.addLeadingSlash(absPath.replace(this.config.sitePath, ''));
        //let relPath = GfPath.absPath.replace(this.config.sitePath, '');
        let basename = path.basename(relPath, path.extname(relPath));
        let ext = path.extname(relPath).substring(1);
        let op = path.join(this.config.sitePath, options.outputDir, path.dirname(relPath));

        if (!skip) {

            // Aliases?
            if (options.aliases && options.aliases[ext]) {
                ext = options.aliases[ext];
            }

            // Image dimensions.
            let dims = imageSize(absPath);
            let srcWidth = dims.width;
            let srcHeight = dims.height;

            //let op = path.join(this.config.outputPath, userOptions.output, path.basename(fp, path.extname(fp)) + '.css');
            debug(`Image template handler is processing file: ${relPath}`);
            debug(`Source image size is ${srcWidth} x ${srcHeight}.`);
            debug(`Will output images to ${op}.`);

            let generated = {}

            await Promise.all(options.formats[ext].map(async outputFormat => {
                let processedSomething = false;
                if (!(outputFormat in generated)) {
                    generated[outputFormat] = {files: [], thumbnail: null};
                }
                await Promise.all(options.widths.map(async outputWidth => {
                    if (srcWidth >= outputWidth || options.allowUpscale === true) {
                        let outputLoc = path.join(op, options.filenameMask.replace('{fn}', basename)
                            .replace('{width}', outputWidth).replace('{ext}', outputFormat));

                        let sanity = (outputLoc.match(/_generatedImages/g)).length;
                        if (sanity > 1) {
                            throw new GfAssetProcessorImageError(`Generated images string '_generatedImages' appears more than once in path for: ${outputLoc}, while processing ${relPath}.`);
                        }

                        processedSomething = true;
                        debug(`Processing ${relPath} at ${outputWidth} (srcWidth = ${srcWidth}), format ${outputFormat}`);
                        debug(`===> will output to ${outputLoc}`);
                        let outputHeight = await this.resizeImage(absPath, outputWidth, outputFormat, outputLoc);
                        debug(`Done ${relPath}`);

                        generated[outputFormat].files.push({file: outputLoc.replace(this.config.sitePath, ''), 
                            width: outputWidth, height: outputHeight, mime: this.getMime(outputFormat)});
                    } else {
                        debug(`Skipping ${relPath} because ${outputWidth} < ${srcWidth}, format ${outputFormat}`);
                    }

                }));

                // If we processed nothing then just render at the source width.
                if (!processedSomething) {
                    let outputLoc = path.join(op, options.filenameMask.replace('{fn}', basename)
                        .replace('{width}', srcWidth).replace('{ext}', outputFormat));

                    let sanity = (outputLoc.match(/_generatedImages/g)).length;
                    if (sanity > 1) {
                        throw new GfAssetProcessorImageError(`Generated images string '_generatedImages' appears more than once in path for: ${outputLoc}, while processing ${relPath}.`);
                    }

                    debug(`Default processing ${relPath} at ${srcWidth}, format ${outputFormat}`);
                    debug(`===> will output to ${outputLoc}`);
                    await this.resizeImage(absPath, srcWidth, outputFormat, outputLoc);
                    generated[outputFormat].files.push({file: outputLoc.replace(this.config.sitePath, ''), 
                        width: srcWidth, height: srcHeight, mime: this.getMime(outputFormat)});
                }

                // Thumbnail?
                if (options.generateThumbnail) {
                    let [widthWanted, heightWanted] = this.aspectResize(srcWidth, srcHeight, options.allowUpscale, 
                        options.thumbnailSize.width, options.thumbnailSize.height);
                    let outputLoc = path.join(op, options.thumbnailFilenameMask.replace('{fn}', basename)
                        .replace('{width}', widthWanted).replace('{ext}', outputFormat));

                    let sanity = (outputLoc.match(/_generatedImages/g)).length;
                    if (sanity > 1) {
                        throw new GfAssetProcessorImageError(`Generated images string '_generatedImages' appears more than once in path for: ${outputLoc}, while processing ${relPath}.`);
                    }

                    debug(`Processing ${relPath} at ${widthWanted}, format ${outputFormat}`);
                    debug(`===> will output to ${outputLoc}`);
                    let outputHeight = await this.resizeImage(absPath, widthWanted, outputFormat, outputLoc, options);
                    generated[outputFormat].thumbnail = {file: outputLoc.replace(this.config.sitePath, ''), 
                        width: widthWanted, height: outputHeight, mime: this.getMime(outputFormat)};
                }        
            }));

            // Sort the files in size order.
            for (let outputFormat in generated) {
                generated[outputFormat].files.sort((a,b) => (a.width > b.width) ? 1 : ((b.width > a.width) ? -1 : 0))
            }

            //syslog.inspect(generated, "Error");

            /*
            if (generated.files && generated.files.length > 0) {
                for (let item of generated.files) {
                    let sanity = (item.file.match(/_generatedImages/g)).length;
                    if (sanity > 1) {
                        throw new StaticoImageAssetsHandlerError(`Generated images string '_generatedImages' appears more than once in path for: ${item}, while processing ${relPath}.`);
                    }
                }
            }
            */

            // Save generated.
            this.config.imageInfoStore.addBySrc(relPath, generated);
            this.options.generated.set(relPath, generated);
            this.saveGenerated();
        }

        // Copy the file too.
        let opc = path.join(this.config.outputPath, absPath.replace(this.config.sitePath, ''));

        //if (this.config.processArgs.argv.dryrun) {
        //    debug(`Copy: ${absPath.replace(this.config.sitePath, '')} => ${opc.replace(this.config.sitePath, '')}`)
        //} else {
            FsUtils.mkDirRecurse(path.dirname(opc));
            FsUtils.copyFile(absPath, opc);
        //}

        if (!silent) {
            syslog.log(`Processed image asset: ${relPath}`);
        }

    }

}

module.exports = AssetProcessorImage;