/**
 * Jasmine 2.0 standalone `boot.js` modified for Karma.
 * This file is registered in `index.js`. This version
 * does not include `HtmlReporter` setup.
 */
(function(){

  /**
   * Require Jasmine's core files. Specifically, this requires and
   * attaches all of Jasmine's code to the `jasmine` reference.
   */
  window.jasmine = jasmineRequire.core(jasmineRequire);


  /**
   * Create the Jasmine environment. This is used to run all specs
   * in a project.
   */
  var env = jasmine.getEnv();

  var focusedSuites = [];
  var focusedSpecs  = [];
  var insideFocusedSuite = false;

  var focuseSpec = function(env, description, body) {
    var spec = env.it(description, body);
    focusedSpecs.push(spec.id);
    return spec;
  };

  var focuseSuite = function(env, description, body) {
    if (insideFocusedSuite) {
      return env.describe(description, body);
    }

    insideFocusedSuite = true;
    var suite = env.describe(description, body);
    insideFocusedSuite = false
    focusedSuites.push(suite.id);
    return suite;
  };

  /**
   * Setting up timing functions to be able to be overridden. Certain browsers (Safari, IE 8, phantomjs) require
   * this hack.
   */
  window.setTimeout = window.setTimeout;
  window.setInterval = window.setInterval;
  window.clearTimeout = window.clearTimeout;
  window.clearInterval = window.clearInterval;


  /**
   * Add all of the Jasmine global/public interface to the proper
   * global, so a project can use the public interface directly.
   * For example, calling `describe` in specs instead of
   * `jasmine.getEnv().describe`.
   */
  for (var property in env) {
    if (env.hasOwnProperty(property)) {
      window[property] = env[property];
    }
  }

  env.executeFiltered = function() {
    if (focusedSpecs.length) {
      env.execute(focusedSpecs);
    } else if (focusedSuites.length) {
      env.execute(focusedSuites);
    } else {
      env.execute();
    }
  };


  /**
   * Expose the interface for adding custom equality testers.
   */
  jasmine.addCustomEqualityTester = function(tester) {
    env.addCustomEqualityTester(tester);
  };


  /**
   * Expose the interface for adding custom expectation matchers
   */
  jasmine.addMatchers = function(matchers) {
    return env.addMatchers(matchers);
  };


  /**
   * Expose the mock interface for the JavaScript timeout functions
   */
  jasmine.clock = function() {
    return env.clock;
  };


})();
