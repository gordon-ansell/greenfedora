#!/usr/bin/env node
/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const ProcessArgs = require('./src/processArgs');
const debug = require("debug")("GreenFedora:index");
require('dotenv').config();

try {

    // Grab the process arguments.
    let processArgs = new ProcessArgs();

    syslog.inspect(process.env);

    const GreenFedora = require('./src/greenfedora');

    // Unhandled promise rejections.
    process.on("unhandledRejection", (error, promise) => {
        syslog.error("Unhandled promise rejection.");
        syslog.exception(error);
        process.exitCode = 1;
    });

    // Uncaught exception.
    process.on("uncaughtException", error => {
        syslog.error("Uncaught exception.");
        syslog.exception(error);
        process.exitCode = 1;
    });

    // Rejection handled.
    process.on("rejectionHandled", promise => {
        syslog.warn("A promise rejection was handled asynchronously.");
        syslog.inspect(promise, "warning", "Promise object");
    });    

    // Do some processing.
    if (processArgs.version) {
        console.log(GreenFedora.version());
    } else {
        let gf = new GreenFedora(processArgs);
        gf.init().then(function () {
            try {
                if (processArgs.argv.watch) {
                    return gf.watch();
                } else if (processArgs.argv.serve) {
                    return gf.serve();
                } else {
                    return gf.render();
                }

            } catch (err) {
                syslog.error(`GreenFedora CLI error.`);
                syslog.exception(err);
                process.exitCode = 1;
            }
        })
    }


} catch (err) {
    syslog.error(`Critical error. Black hole. Call interplanetary help.`);
    syslog.exception(err);
    process.exitCode = 1;
}
