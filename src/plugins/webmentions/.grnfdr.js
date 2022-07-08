/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const { syslog, GfPath } = require('greenfedora-utils');
const path = require('path');
const { URL } = require('url');
const WebmentionsData = require('./src/webmentionsData');
const WebmentionsProcessor = require('./src/webmentionsProcessor');
const debug = require('debug')('GreenFedora:Plugin:webmentions');

async function afterParsedTemplateFile(cfg, tpl, data)
{
    let bc = cfg.getBaseConfig();

    if (!bc.webmentions || !bc.webmentions.id) {
        syslog.warning("Webmentions processing switched off. Perhaps you want to include a 'webmentions' block in the config.")
        return null;
    } 
    let proc = WebmentionsProcessor.getProcessor(cfg);

    // Save the URL.
    let url = GfPath.addTrailingSlash((new URL(data.permalink, bc.hostname)).toString());

    // Received.
    let wmentions = proc.mentionsForUrl(url);
    if (wmentions && wmentions.length > 0) {
        data.wmentions = wmentions;
        syslog.notice(`Post ${data.permalink} has ${wmentions.length} webmentions.`);
    } else {
        debug(`Post ${data.permalink} has no webmentions.`);
    }

    // To send.
    if (!data.sendWebmentions) {
        return;
    }

    let test = (data.mode !== 'prod') ? true : false;

    for (let wm of data.sendWebmentions) {
        if (!proc.hasBeenSent(url, wm, test)) {
            await proc.send(url, wm, test);
        }
    }
}

async function afterInit(cfg)
{
    let bc = cfg.getBaseConfig();
    if (!bc.webmentions || !bc.webmentions.id) {
        syslog.warning("Webmentions processing switched off. Perhaps you want to include a 'webmentions' block in the config.")
        return null;
    } 
    let wmd = new WebmentionsData(cfg);
    let mentions = await wmd.process();
    cfg.config.mentions = mentions;
}


module.exports = function(config) {

    let webmentionsSpecDef = {
        cacheFile: 'received.json',
        cacheFileTest: 'testReceived.json',
        mentionsApi: "https://webmention.io/api/mentions.jf2",
        on: false,
        ownUrls: undefined,
        perPage: 10000,
        sentFile: 'sent.json',
        sentFileTest: 'testSent.json',
        typeIcons: true,
        types: ['mention-of', 'in-reply-to'],
        wmDir: '_data/__webmentions',
    };

    let bc = config.getBaseConfig();

    if (bc.webmentionsSpec) {
        bc.webmentionsSpec = merge.merge(webmentionsSpecDef, bc.webmentionsSpec)
    } else {
        bc.webmentionsSpec = webmentionsSpecDef;
    }

    config.addGlobalData('isOwnWebmention', function(bc, webmention) {
        const urls = (bc.webmentionsSpec.ownUrls) ? (bc.webmentionsSpec.ownUrls) : 
            [bc.hostname];
        const authorUrl = webmention['author'] ? webmention['author']['url'] : null;
        return authorUrl && urls.includes(authorUrl);
    });

    config.eventManager.on('CONFIG_LOAD_FINISHED', afterInit);
    config.eventManager.on('BEFORE_RENDER_SINGLE_TEMPLATE', afterParsedTemplateFile);

    syslog.log(`GreenFedora webmentions plugin loaded.`);

    return {};

}