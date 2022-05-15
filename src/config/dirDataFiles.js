/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const path = require('path');
const GfPath = require('../utils/gfPath');
const fs = require('fs');
const Merge = require('../utils/merge');
const DataFileLoader = require('./dataFileLoader');
const { syslog } = require('../utils/logger');
const debug = require("debug")("GreenFedora:DirDataFiles");

/**
 * Read directory data files.
 */
class DirDataFiles
{
    /**
     * File path.
     * @member  {string}
     */
    filePath = null;

    /**
     * Relative path.
     * @member  {string}
     */
    relPath = null;

    /**
     * Config.
     * @member {Config}
     */
    config = null;

    /**
     * Constructor.
     * 
     * @param   {string}    filePath    Path to file.
     * @param   {Config}    config      Configs.
     * 
     * @return  {DirDataFiles}
     */
    constructor(filePath, config)
    {
        if (filePath.startsWith('.')) {
            filePath = path.resolve(filePath);
        }

        if (!filePath.startsWith(config.sitePath)) {
            this.filePath = path.join(config.sitePath, filePath);
        } else {
            this.filePath = filePath;
        }

        this.relPath = this.filePath.replace(config.sitePath, '');

        this.config = config;
    }

    /**
     * Read.
     * 
     * @return  {object}
     */
    read()
    {
        let ret = {};
        let dirPath = GfPath.addTrailingSlash(path.dirname(this.filePath));
        let base = path.basename(this.relPath, path.extname(this.relPath));
        let elems = GfPath.removeBothSlashes(dirPath.replace(this.config.sitePath, '')).split(path.sep);

        if (elems.length > 0) {

            let curr = this.config.sitePath;
            let recurses = ['.grnfdr.recurse.yaml', '.grnfdr.recurse.json', '.grnfdr.recurse.js'];
            let recurseData = {};
            let specificData = {};
            let fileData = {};
            for (let elem of elems) {
                curr = path.join(curr, elem);
                let entries = fs.readdirSync(curr);

                if (entries.length > 0) {

                    // Recuse directory data.
                    for (let t of recurses) {
                        let file = path.join(curr, t);
                        if (fs.existsSync(file)) {
                            debug(`Loading recursive directory data file: %s`, file);
                            let data = DataFileLoader.load(file, this.config);
                            recurseData = Merge.merge(recurseData, data);
                        }
                    }

                    // Specific directory data.
                    if (curr === dirPath) {
                        let specifics = ['.grnfdr.dir.yaml', '.grnfdr.dir.json', '.grnfdr.dir.js'];
                        for (let t of specifics) {
                            let file = path.join(curr, t);
                            if (fs.existsSync(file)) {
                                debug(`Loading specific directory data file: %s`, file);
                                let data = DataFileLoader.load(file, this.config);
                                specificData = Merge.merge(specificData, data);
                            } 
                        }
                    }

                    // File data.
                    if (curr === dirPath) {
                        let files = ['.grnfdr.' + base + '.yaml', '.grnfdr.' + base + '.json', '.grnfdr.' + base + '.js'];
                        for (let t of files) {
                            let file = path.join(curr, t);
                            if (fs.existsSync(file)) {
                                debug(`Loading file data file: %s`, file);
                                let data = DataFileLoader.load(file, this.config);
                                fileData = Merge.merge(fileData, data);
                            }
                        }
                    }
                }
            }

            ret = Merge.mergeMany([recurseData, specificData, fileData]);

        }

        return ret;

    }
}

module.exports = DirDataFiles;