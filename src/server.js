/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog } = require('greenfedora-utils');
const path = require('path');
const express = require('express');
const debug = require("debug")("GreenFedora:Server");
const debugdev = require("debug")("Dev.GreenFedora:Server");

/**
 * Express server.
 */
class Server
{
    /**
     * Configs.
     */
    config = null;

    /**
     * Site path.
     * @member {string}
     */
    sitePath = null;

    /**
     * Output path.
     * @member {string}
     */
    outputPath = null;

    /**
     * Address.
     * @member {string}
     */
    address = null;

    /**
     * Port.
     * @member {int}
     */
    port = 8081;

    /**
     * The server itself.
     * @member {express}
     */
    server = null;

    /**
     * Constructor.
     * 
     * @param   {Config}        config          Configs.
     * @param   {int}           port            Port to serve on.
     * 
     * @return  {Server}
     */
    constructor(config, port = 8081)
    {
        this.config = config;
        this.outputPath = path.join(this.config.outputPath);
        this.sitePath = path.join(this.config.sitePath);
        this.address = this.config.hostname;
        this.port = port;
    }

    /**
     * Start the server.
     * 
     * @return {Server}
     */
    start()
    {
        debug("Site path: " + this.outputPath);

        syslog.notice(`Attempting to start serving via Express from: ${this.outputPath}.`);
        debug("Address: " + this.address);
        debug("Port: " + this.port);

        this.server = express();

        this.server.use(express.urlencoded({ extended: true }));

        this.server.use('/', express.static(this.outputPath));

        this.server.listen(this.port, () => {
            syslog.notice(`Express server running at ${this.address}`);
        });

        return this;
    }

    /**
     * Stop the server.
     * 
     * @return  {void}
     */
    stop()
    {
        if (this.server) {
            syslog.notice(`Express server shutting down.`);
        }
    }
}

module.exports = Server;