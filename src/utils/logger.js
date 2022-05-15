/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const kleur = require('kleur');
const util = require('util');

/**
 * Logger class.
 */
class Logger {

    /**
     * Static syslog.
     * @member {Logger|null}
     */
    static _syslog = null;

    /**
     * Buffer.
     * @member {string}
     */
    _buffer = '';

    /**
     * Log level.
     * @member {string}
     */
    _level = 'log';

    /**
     * Message colours.
     * @member {object}
     */
    _cols = {
        trace: "gray",
        debug: "blue",
        info: "green",
        log: "reset",
        warn: "red",
        error: ["bold", "red"]
    };

    /**
     * Message levels.
     * @member {object}
     */
    _levels = {
        trace: 10,
        debug: 20,
        info: 30,
        log: 40,
        warn: 50,
        error: 60,
        silence: 999999
    };

    /**
     * Constructor
     * 
     * @param   {string}    [level='log']   Log level.
     * 
     * @return  {Logger}
     */
    constructor(level = 'log')
    {
        this._level = level;
    }

    /**
     * Static logger.
     * 
     * @param   {string}    [level='log']   Log level.
     * 
     * @return  {Logger}                    Static logger.
     * @static
     */
    static syslog(level = 'log')
    {
        if (null === Logger._syslog) {
            Logger._syslog = new Logger(level);
        }
        return Logger._syslog;
    }

    /**
     * Set the level.
     * 
     * @param   {string}    level           Log level.
     * 
     * @return  {string}                    Old level.
     */
    setLevel(level)
    {
        let saved = this._level;
        this._level = level;
        return saved;
    }

    /**
     * Silence the logger.
     * 
     * @return  {string}                    Old level.
     */
    silence()
    {
        let saved = this._level;
        this._level = 'silence';
        return saved;
    }

    /**
     * Set the logger to debug mode.
     * 
     * @return  {string}                    Old level.
     */
    debugMode()
    {
        let saved = this._level;
        this._level = 'trace';
        return saved;
    }

    /**
     * Send a message to buffer.
     * 
     * @param   {string}                                msg             Message to send.
     * 
     * @return  {Logger}
     */
    buffer(msg)
    {
        this._buffer += msg;
        return this;
    }

    /**
     * Close the buffer.
     * 
     * @return  {string}                                                The stream.
     */
    bufferClose()
    {
        let ret = this._buffer;
        this._buffer = '';
        return ret;
    }

    /**
     * Output an error message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    error(msg) 
    {
        this.msg(msg, 'error');
    }

    /**
     * Output a warning message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    warn(msg) 
    {
        this.msg(msg, 'warn');
    }

    /**
     * Output a warning message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    warning(msg) 
    {
        this.warn(msg);
    }

    /**
     * Output a log message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    log(msg) 
    {
        this.msg(msg, 'log');
    }

    /**
     * Output a log message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    notice(msg) 
    {
        this.log(msg);
    }

    /**
     * Output an info message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    info(msg) 
    {
        this.msg(msg, 'info');
    }

    /**
     * Output a debug message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    debug(msg) 
    {
        this.msg(msg, 'debug');
    }

    /**
     * Output a trace message.
     * 
     * @param   {string}                                msg             Message to output.
     * 
     * @return  {void}
     */
    trace(msg) 
    {
        this.msg(msg, 'trace');
    }

    /**
     * Force a message.
     * 
     * @param   {string}                                        msg             Message to output.
     * @param   {'error'|'warn'|'log'|'info'|'debug'|'trace'}   [level='log']   Message level.
     * 
     * @return  {void}
     */
    force(msg, level='log')
    {
        this.msg(msg, level, true);
    }

    /**
     * See if we should display at a particular level.
     * 
     * @param   {'error'|'warn'|'log'|'info'|'debug'|'trace'}   level           Message level.
     * @param   {boolean}                                       [force=false]   Force logging.
     * 
     * @return  {boolean}
     */
    shouldDisplay(level, force = false)
    {
        if ((this._levels[level] >= this._levels[this._level]) || force) {
            return true;
        }
        return false;
    }

    /**
     * Output a message.
     * 
     * @param   {string}                                        msg             Message to output.
     * @param   {'error'|'warn'|'log'|'info'|'debug'|'trace'}   [level='log']   Message level.
     * @param   {boolean}                                       [force=false]   Force logging.
     * @param   {number}                                        [indent=0]      Indent level.
     * 
     * @return  {void}
     */
    msg(msg, level = 'log', force = false, indent = 0)   
    {
        if (this.shouldDisplay(level, force)) {

            if (indent > 0) {
                let sp = msg.split("\n");
                let lines = [];
                for (let line of sp) {
                    lines.push("  ".repeat(indent) + line);
                }
                msg = lines.join("\n");
            }

            let tag = `[GreenFedora:${level}]`

            msg = `${tag} ${msg.split("\n").join("\n" + tag)}`;

            if (Array.isArray(this._cols[level])) {
                console[level](kleur[this._cols[level][0]]()[this._cols[level][1]](msg));
            } else {
                console[level](kleur[this._cols[level]](msg));
            }

        }
    }

    /**
     * Handle an exception.
     * 
     * @param   {Error}                                         ex                  Exception object.
     * @param   {'error'|'warn'|'log'|'info'|'debug'|'trace'}   [level='error']     Message level.
     * @param   {boolean}                                       [force=false]       Force logging.
     * @param   {boolean}                                       [stackTraces=true]  Do we want stack traces?
     */
    exception(ex, level = "error", force = false, stackTraces = true)
    {
        this.msg(`==> ${ex.name} Exception: ${ex.message}`, level, force);

        if (ex.stack && stackTraces) {
            this.msg(ex.stack.split("\n").slice(1).join("\n"), level, force);
        }

        if (ex.originalError) {
            let orig = ex.originalError;
            let indent = 2;

            while (orig) {
                this.msg(`\n==> A previous exception of type '${orig.name}' was encountered: ${orig.message}`, 
                    level, force, indent);

                if (orig.stack && stackTraces) {
                    this.msg(orig.stack.split('\n').slice(1).join("\n"), level, force, indent);
                }

                if (orig.originalError) {
                    indent++;
                    orig = orig.originalError;
                } else {
                    orig = null;
                }
            }
        }
    }

    /**
     * Inspection.
     * 
     * @param   {any}                                           obj             Anything you want to inspect.
     * @param   {string|null}                                   [header=null]   Message to precede inspect.
     * @param   {'error'|'warn'|'log'|'info'|'debug'|'trace'}   [level='warn']  Message level.
     * @param   {boolean}                                       [force=false]   Force logging.
     * 
     * @return  {void}
     */
    inspect(obj, header = null, level = 'warn', force = false)
    {

        if (this.shouldDisplay(level, force)) {

            let headerMsg = "Inspect: ";
            if (null !== header) {
                headerMsg += header;
            }
            headerMsg += ' ====>';

            let dump = util.inspect(obj, true, null, true);

            this.msg(`${headerMsg}\n${dump}`, level, force);
        }

    }
}

exports.Logger = Logger;
exports.syslog = Logger.syslog();