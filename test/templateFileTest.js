const test = require("ava");
const path = require('path');
const Config = require('../src/config');
const TemplateFile = require('../src/template/file/templateFile');
const { syslog } = require("../src/utils/logger");

test("Check we're extracting front matter and content okay.", async t => {
    let cfg = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    cfg.postProcessing();
    let m = cfg.getBaseConfig();

    let c = new TemplateFile(path.resolve('./test/test-site/about.md'), cfg);
    await c.read();

    //syslog.inspect(c);

    t.is(c.frontMatter.data.title, "My test file");
    t.is(c.frontMatter.excerpt, "This is a fine excerpt");
    t.is(c.frontMatter.content, "This is test *Markdown*.");
    
});

