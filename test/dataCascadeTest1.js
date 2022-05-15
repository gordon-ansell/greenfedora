const test = require("ava");
const Config = require('../src/config');
const PluginManager = require('../src/config/pluginManager');

test("Check the base data cascades ok.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');
    let r = c.getBaseConfig();
    t.is(r['_test_thisconfig_is'], "Local Config");
});

test("Check we can override base data with input parameter.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js', 
        {'_test_thisconfig_is': "Input Config"});
    let r = c.getBaseConfig();
    t.is(r['_test_thisconfig_is'], "Input Config");
});

test("Check the base data + plugins cascades ok.", t => {
    let c = new Config('./test/test-site', './test/test-site/_site', './test/test-site/.grnfdr.js');

    let examplePlugin1 = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            plugin1: {
                one: 1
            }
        }
    };

    let examplePlugin2 = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            plugin2: {
                one: 2
            }
        }
    };

    c.userConfig.pluginManager.addPlugin(examplePlugin1);
    c.userConfig.pluginManager.addPlugin(examplePlugin2);

    let r = c.getBaseConfig();
    t.is(r['_test_thisconfig_is'], "Local Config");
    t.is(r.plugin1.one, 1);
    t.is(r.plugin2.one, 2);
});

