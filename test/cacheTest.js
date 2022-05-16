const test = require("ava");
const { Cache } = require('greenfedora-utils');
const fs = require('fs');

test("Check we can add a cache group.", t => {
    let c = new Cache();
    c.addGroup('testing1');
    t.true(c.hasGroup('testing1'));
});

test("Check we can add, retrieve and delete a cache item.", t => {
    let c = new Cache();
    c.addGroup('testing1');
    t.true(c.hasGroup('testing1'));

    c.add('blah', 123, 'testing1');

    t.true(c.hasGroup('testing1'));
    t.true(c.has('blah', 'testing1'));
    t.is(c.get('blah', 'testing1'), 123);

    c.del('blah', 'testing1');
    t.false(c.has('blah', 'testing1'));

});

test("Check the default cache group.", t => {
    let c = new Cache();

    c.add('blah', 456);

    t.true(c.has('blah'));
    t.is(c.get('blah'), 456);

    c.del('blah');
    t.false(c.has('blah'));

});


test("Save simple group to file and restore it.", t => {
    let c = new Cache();
    c.addGroup('testing1');

    c.add('blah', 123, 'testing1');

    c.getGroup('testing1').save('./test/test-site/testing1.json');

    c.delGroup('testing1');

    c.addGroup('testing1');

    c.getGroup('testing1').load('./test/test-site/testing1.json');

    t.is(c.get('blah', 'testing1'), 123);

    fs.unlinkSync('./test/test-site/testing1.json');
});

test("Multigroup save and restore.", t => {
    let c = new Cache();
    c.addGroup('testing1');
    c.add('blah', 123, 'testing1');

    c.addGroup('testing2');
    c.add('blob', 456, 'testing2');

    c.add('hungry', 'horse');

    c.save('./test/test-site/savetest');

    c = new Cache();

    c.load('./test/test-site/savetest');

    t.is(c.get('blah', 'testing1'), 123);
    t.is(c.get('blob', 'testing2'), 456);
    t.is(c.get('hungry'), 'horse');

    fs.rmSync('./test/test-site/savetest', { recursive: true});

    //fs.unlinkSync('./test/test-site/testing1.json');
});