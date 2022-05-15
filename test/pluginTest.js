const test = require("ava");
const PluginManager = require('../src/config/pluginManager');

test("Check we can add a plugin.", t => {
    let c = new PluginManager();

    let examplePlugin = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            one: 1,
            two: 'two'
        }
    };

    c.addPlugin(examplePlugin);
    t.is(c.plugins.length, 1);
    t.is(c.plugins[0].plugin.name, 'examplePlugin');
});

test("Check we can load a plugin.", t => {
    let c = new PluginManager();

    let examplePlugin = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            one: 1,
            two: 'two'
        }
    };

    c.addPlugin(examplePlugin);
    t.is(c.plugins.length, 1);
    t.is(c.plugins[0].plugin.name, 'examplePlugin');

    let result = c.loadPlugin(c.plugins[0].plugin, c.plugins[0].options);
    t.is(result.one, 1);
    t.is(result.two, 'two');
});

test("Check we can load multiple plugins.", t => {
    let c = new PluginManager();

    let examplePlugin1 = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            one: 1,
            two: 'two'
        }
    };

    let examplePlugin2 = function(userConfig, options = {}) {
        //console.log(`Example plugin loaded.`);
        return {
            two: 'else',
            three: 'number-03'
        }
    };

    c.addPlugin(examplePlugin1);
    c.addPlugin(examplePlugin2);
    t.is(c.plugins.length, 2);
    t.is(c.plugins[0].plugin.name, 'examplePlugin1');
    t.is(c.plugins[1].plugin.name, 'examplePlugin2');

    let result = c.loadPlugins();
    t.is(result.one, 1);
    t.is(result.two, 'else');
    t.is(result.three, 'number-03');
});
