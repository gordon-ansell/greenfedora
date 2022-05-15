const test = require("ava");
const ProcessArgs = require('../src/processArgs');
const GfError = require('../src/utils/gfError');

test("Basic check of flag and string args.", t => {
    let p = new ProcessArgs(['--silent', '--input=./input']);
    t.is(p.silent, true);
    t.is(p.input, './input');
});

test("Check default args stand.", t => {
    let p = new ProcessArgs(['--silent', '--input=./input']);
    t.is(p.output, './_site');
});

test("Check invalid argument throws exception.", t => {
    const error = t.throws(() => {
        new ProcessArgs(['--invalid']);
    }, {instanceOf: GfError})
    t.is(error.message, 'Unrecognised argument: \'--invalid\'. Use --help to see the list of supported commands.');
});


