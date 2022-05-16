const test = require("ava");
const Config = require('../src/config');
const GlobalDataFileConfig = require('../src/config/globalDataFileConfig');
const { syslog } = require("greenfedora-utils");

test("Check global data loads from YAML, JSON and Javascript.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    let r = c.getBaseConfig();
    let gdfc = GlobalDataFileConfig.getData(c);
    t.is(gdfc.blah.jsondata.datafromjson, 'This is data from JSON');
    t.is(gdfc.js1.js2.jsdata.jssomething, 'Some js data');
    t.is(gdfc.site.title, "Gordy's Discourse");
});

