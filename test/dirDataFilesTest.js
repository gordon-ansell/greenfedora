const test = require("ava");
const Config = require('../src/config');
const DirDataFiles = require('../src/config/dirDataFiles');
const { syslog } = require("greenfedora-utils");

test("Check simple single file.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    c.postProcessing();
    let ddf = new DirDataFiles('./test/test-site/posts1/2022/05/mypost.md', c);
    let data = ddf.read();
    t.is(data.test1, 'hello');
});

test("Check specific directory file overwrites a recursive one.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    c.postProcessing();
    let ddf = new DirDataFiles('./test/test-site/posts2/2022/05/mypost.md', c);
    let data = ddf.read();
    t.is(data.test1, 'Goodbye');
});

test("Check a unique file config overwrites all directory ones.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    c.postProcessing();
    let ddf = new DirDataFiles('./test/test-site/posts3/2022/05/mypost.md', c);
    let data = ddf.read();
    t.is(data.test1, 'greetings');
});
