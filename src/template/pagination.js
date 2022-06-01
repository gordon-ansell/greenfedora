/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { GfError, syslog, GfString, FsUtils } = require('GreenFedora-Utils');
const lodashget = require("lodash/get");
const lodashhas = require("lodash/has");
const fs = require('fs');
const path = require('path');
const Collection = require('../collection');
const debug = require("debug")("GreenFedora:Pagination");

// Local error.
class GfPaginationError extends GfError {};

/**
 * Pagination.
 */
class Pagination
{
    /**
     * Template data.
     * @member  {object}
     */
    tplData = null;

    /**
     * Config.
     * @member  {Config}
     */
    config = null;

    /**
     * Constructor.
     * 
     * @param   {object}    tplData     Template data.   
     * @param   {Config}    config      Configs.
     * 
     * @return  {Pagination}
     */
    constructor(tplData, config)
    {
        this.tplData = tplData;
        this.config = config;
    }

    /**
     * Calculate pagination stuff.
     * 
     * @param   {boolean}   generate    Generate pages?
     * 
     * @return  {void}
     */
    calculate(generate = true)
    {

        let pagination = this.tplData.pagination;

        if (!pagination.data) {
            throw new GfPaginationError(`Pagination needs a 'data' source setting.`);
        }

        if (!pagination.alias) {
            throw new GfPaginationError(`Pagination needs an 'alias' source setting.`);
        }

        pagination.perPage = parseInt(pagination.perPage || 10);

        if (!lodashhas(this.tplData, `${pagination.data}`)) {
            throw new GfPaginationError(`Pagination 'data' is unresolvable for '${pagination.data}'.`);
        }

        let datasrc = lodashget(this.tplData, `${pagination.data}`);

        pagination.page = parseInt(pagination.page);
        pagination.size = parseInt(datasrc.getSize());
        pagination.pageCount = Math.ceil(pagination.size / pagination.perPage);
        pagination.from = ((pagination.page + 1) * pagination.perPage) - pagination.perPage;
        pagination.to = pagination.from + pagination.perPage - 1;

        if (pagination.to > pagination.size - 1) {
            pagination.to = pagination.size - 1;
        }

        debug(`Pagination calcs for %s`, this.tplData.relPath);
        debug(`page: ${pagination.page + 1}, perPage: ${pagination.perPage}, from: ${pagination.from}, to: ${pagination.to}`);

        this.tplData[pagination.alias] = datasrc.getSelected(pagination.from, pagination.to, 'date-desc');

        if (pagination.pageCount > 1 && generate) {

            if (!pagination.tpl) {
                throw new GfPaginationError(`Pagination needs a 'tpl' specified for additional home pages.`);
            }

            let dummyPath = path.join(this.tplData.sitePath, this.tplData.locations.layouts, pagination.tpl);

            if (!fs.existsSync(dummyPath)) {
                throw new GfPaginationError(`No pagination dummy file found at ${dummyPath}`);
            }

            let dummyData = fs.readFileSync(dummyPath, 'utf-8');

            let tmpPath = path.join(this.tplData.sitePath, this.tplData.locations.temp);
            if (fs.existsSync(tmpPath)) {
                FsUtils.deleteFolderRecursive(tmpPath);
            }
            fs.mkdirSync(tmpPath, {recursive: true});

            for (let newPage = 1; newPage < pagination.pageCount; newPage++) {
                let fn = path.join(tmpPath, String(newPage + 1) + '.njk');
                let op = GfString.replaceAll(dummyData, '[[page]]', String(newPage + 1));
                op = GfString.replaceAll(op, '[[pageIndex]]', String(newPage));
                fs.writeFileSync(fn, op, 'utf-8');
            }
        }

    }

    /**
     * Do the prev/next links for a collection.
     * 
     * @param   {object[]}      coll        Collection to do.
     * 
     * @return  {void}  
     */
    static prevNext(data)
    {
        let prevSaved = null;
        if (data.length > 1) {
            prevSaved = data[1];
        }
        let nextSaved = null;
        let count = 0;
        for (let idx in data) {
            if (!data[idx].templateData.lateData) {
                data[idx].templateData.lateData = {};
            }
            if (!data[idx].templateData.lateData.pagination) {
                data[idx].templateData.lateData.pagination = {};
            }

            if (prevSaved) {
                data[idx].templateData.lateData.pagination.prev = prevSaved;
            }
            if (nextSaved) {
                data[idx].templateData.lateData.pagination.next = nextSaved;
            }
            nextSaved = data[idx];
            if (data[idx + 1]) {
                prevSaved = data[idx + 1];
            } else {
                prevSaved = null;
            }
            //syslog.inspect(data[idx].templateData.lateData.pagination);
            count++;
        }
    }
}

module.exports = Pagination;