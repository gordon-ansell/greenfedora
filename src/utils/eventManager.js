/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const GfError = require("./gfError");
const { syslog } = require("./logger");
const debug = require("debug")("GreenFedora:EventManager");


// Local error.
class GfEventManagerError extends GfError {};

/**
 * Event manager class.
 */
class EventManager
{
    /**
     * Events.
     * @member {object}
     */
    #events = {};

    /**
     * Valid events.
     * @member {object}
     */
    #validEvents = [];

    /**
     * Constructor.
     * 
     * @param   {string[]}  ev          Array of valid event names. 
     * 
     * @return  {EventManager}
     */
    constructor(ev) 
    {
        if (ev) {
            this.setValidEvents(ev);
        }
    }

    /**
     * Set the valid events.
     * 
     * @param   {string[]}  ev          Array of valid event names. 
     * 
     * @return  {EventManager}
     */
    setValidEvents(ev)
    {
        this.#validEvents = ev;
        return this;
    }

    /**
     * Get the valid events.
     * 
     * @return  {string[]}
     */
    get validEvents()
    {
        return this.#validEvents;
    }

    /**
     * Add a plugin to an event.
     * 
     * @param   {string}    event       Event.
     * @param   {function}  func        Function to call.
     * @param   {number}    pri         Priority.
     * 
     * @return  {void}
     * 
     * @throws  {GfEventManagerError}   On any error.
     */
    on(event, func, pri)
    {
        if (!this.#validEvents.includes(event)) {
            throw new GfEventManagerError(`'${event}' is an invalid event name.`);
        }
        if (typeof func != "function") {
            throw new GfEventManagerError("Event 'on' must be passed a function (${event}).");
        }
        if (!pri) {
            pri = 50;
        }
        if (!this.#events[event]) {
            this.#events[event] = [];
        }
        this.#events[event].push({func: func, pri: pri});
    }

    /**
     * Emit an event.
     * 
     * @param   {string}    event       Event.
     * @param   {any}       args        Arguments. 
     * 
     * @return  {void}
     * 
     * @throws  {GfEventManagerError}   On any error.
     */
    async emit(event, ...args)
    {
        debug(`Called emit for event '${event}'.`);

        if (!this.#validEvents.includes(event)) {
            throw new GfEventManagerError(`'${event}' is an invalid event name.`);
        }
        if (!this.#events[event]) {
            debug(`There are no users tied to event '${event}'.`);
            return;
        }

        debug(`Emitting event '${event}'.`);

        let sorted = this.#events[event].sort((a, b) => {
            if (a.pri < b.pri) {
                return -1;
            }
            if (b.pri < a.pri) {
                return 1;
            }
            return 0;    
        });

        let pri = {};

        for (let cb of sorted) {
            if (!pri[cb.pri]) {
                pri[cb.pri] = [];
            }
            pri[cb.pri].push(cb.func);
        }

        for (let key in pri) {
            let funcs = pri[key];
            await Promise.all(funcs.map(async f => {
                try {
                    await f.call(this, ...args);
                } catch (err) {
                    throw new GfEventManagerError(`Event function call failed for ${event}.`, '', err);
                }
            }));
        }

        debug(`Emitted event '${event}'.`);
    }

}

module.exports = EventManager;
