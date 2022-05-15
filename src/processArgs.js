/**
 * Please refer to the following files in the root directory:
 * 
 * README.md        For information about the package.
 * LICENSE          For license details, copyrights and restrictions.
 */
'use strict';

const GfError = require('./utils/gfError');
const debug = require("debug")("GreenFedora:ProcessArgs");

// Local error.
class GfProcessArgsError extends GfError {};

/**
 * Command line argument processing class.
 */
class ProcessArgs
{
    /**
     * Command line arguments.
     * @member {object|null}
     */
    argv = null;

    /**
     * Constructor.
     * 
     * @param   {string[]|null}   pa    Manual argument string.      
     * 
     * @return  {ProcessArgs}
     * 
     * @throws  {GfProcessArgsError}    If something's amiss.
     */
    constructor(pa = null)
    {
        let inputArgs; 
        
        if (null === pa) {
            inputArgs = process.argv.slice(2);
        } else {
            if (!Array.isArray(pa)) {
                throw new GfProcessArgsError(`Manual input to ProcessArgs should be an array of strings.`);
            }
            inputArgs = pa;
        }

        debug(`Raw input arguments are: %o`, inputArgs);

        this.argv = require("minimist")(inputArgs, {
            string: [
              "input",
              "output",
              "config",
              "level"
            ],
            boolean: [
              "silent",
              "version"
            ],
            default: {
              input: './',
              output: './_site',
              config: null,
              level: 'log',
              silent: false,
              version: false,
            },
            unknown: function (unknownArgument) {
              throw new GfProcessArgsError(`Unrecognised argument: '${unknownArgument}'. Use --help to see the list of supported commands.`);
            },
        });        

        debug(`Parsed input arguments are: %o`, this.argv);
    }

    /**
     * String accessors.
     * 
     * @return  {string}
     */
    get input() {return this.argv.input;}
    get output() {return this.argv.output;}
    get level() {return this.argv.level;}

    /**
     * Boolean accessors.
     * 
     * @return  {boolean}
     */
    get silent() {return this.argv.silent;}
    get version() {return this.argv.version;}

}

module.exports = ProcessArgs;