const test = require("ava");
const { Logger } = require('../src/utils/logger');

test("By default we display log messages.", t => {
    let l = new Logger();
    t.true(l.shouldDisplay('log'));
});

test("By default we DO NOT display info messages.", t => {
    let l = new Logger();
    t.false(l.shouldDisplay('info'));
});

test("By default we display info messages if we use 'force'.", t => {
    let l = new Logger();
    t.true(l.shouldDisplay('info', true));
});

test("Set the level to display info and check it works.", t => {
    let l = new Logger();
    let saved = l.setLevel('info');
    t.true(l.shouldDisplay('info'));
    t.is(saved, 'log');
});

test("Check silence mode works.", t => {
    let l = new Logger();
    let saved = l.silence();
    t.false(l.shouldDisplay('error'));
    t.is(saved, 'log');
});

test("Check debug mode works.", t => {
    let l = new Logger();
    let saved = l.debugMode();
    t.true(l.shouldDisplay('trace'));
    t.is(saved, 'log');
});

test("Test the buffer.", t => {
    let l = new Logger();
    l.buffer('one');
    l.buffer('two');
    t.is(l.bufferClose(), 'onetwo');
});