var formatFailedStep = function(step) {
  var stack   = step.stack;
  var message = step.message;

  if (stack) {
    // remove the trailing dot
    var firstLine = stack.substring(0, stack.indexOf('\n') - 1);

    if (message && message.indexOf(firstLine) === -1) {
      stack = message +'\n'+ stack;
    }

    // remove jasmine stack entries
    return stack.replace(/\n.+jasmine\.js\?\w*\:.+(?=(\n|$))/g, '');
  }

  return message;
};


var indexOf = function(collection, item) {
  if (collection.indexOf) {
    return collection.indexOf(item);
  }

  for (var i = 0, l = collection.length; i < l; i++) {
    if (collection[i] === item) {
      return i;
    }
  }

  return -1;
};


var SuiteNode = function(result, parent) {
  this.description = result ? result.description : '';
  this.parent = parent;
  this.children = [];

  this.addChild = function(result) {
    var suite = new SuiteNode(result, this);
    this.children.push(suite);
    return suite;
  };
};


var getAllSpecNames = function(topSuite) {
  var specNames = {};

  function processSuite(suite, pointer) {
    var child;
    var childPointer;

    for (var i = 0; i < suite.children.length; i++) {
      child = suite.children[i];

      if (child.children) {
        childPointer = pointer[child.description] = {_: []};
        processSuite(child, childPointer);
      } else {
        pointer._.push(child.description);
      }
    }
  }

  processSuite(topSuite, specNames);

  return specNames;
};


/**
 * Very simple reporter for Jasmine.
 */
var KarmaReporter = function(tc, jasmineEnv) {

  var currentSuite = new SuiteNode();

  /**
   * Jasmine 2.0 dispatches the following events:
   *
   *  - jasmineStarted
   *  - jasmineDone
   *  - suiteStarted
   *  - suiteDone
   *  - specStarted
   *  - specDone
   */


  /**
   * @param {{totalSpecsDefined: number}} data
   */
  this.jasmineStarted = function(data) {
    // TODO(vojta): Do not send spec names when polling.
    tc.info({
      total: data.totalSpecsDefined,
      specs: getAllSpecNames(jasmineEnv.topSuite())
    });
  };


  this.jasmineDone = function() {
    tc.complete({
      coverage: window.__coverage__
    });
  };


  /**
   * @param {{}} result
   * @param {string} result.description
   * @param {string} result.fullName
   * @param {string} result.id
   * @param {string} result.status
   */
  this.suiteStarted = function(result) {
    currentSuite = currentSuite.addChild(result);
  };


  /**
   * @param {{}} result
   * @param {string} result.description
   * @param {string} result.fullName
   * @param {string} result.id
   * @param {string} result.status
   */
  this.suiteDone = function(result) {
    // In the case of xdescribe, only "suiteDone" is fired.
    // We need to skip that.
    if (result.description !== currentSuite.description) {
      return;
    }

    currentSuite = currentSuite.parent;
  };


  /**
   * @param {{}} specResult
   * @param {string} specResult.description
   * @param {Array} specResult.failedExpectations
   * @param {string} specResult.fullName
   * @param {string} specResult.id
   */
  this.specStarted = function(specResult) {
    specResult.startTime = new Date().getTime();
  };


  /**
   * @param {{}} specResult
   * @param {string} specResult.description
   * @param {Array} specResult.failedExpectations
   * @param {string} specResult.fullName
   * @param {string} specResult.id
   * @param {number} specResult.startTime
   * @param {string} specResult.status
   */
  this.specDone = function(specResult) {
    var skipped = specResult.status === 'disabled' || specResult.status === 'pending';

    var result = {
      description : specResult.description,
      id          : specResult.id,
      log         : [],
      skipped     : skipped,
      success     : specResult.failedExpectations.length === 0,
      suite       : [],
      time        : skipped ? 0 : new Date().getTime() - specResult.startTime
    };

    // generate ordered list of (nested) suite names
    var suitePointer = currentSuite;
    while (suitePointer.parent) {
      result.suite.unshift(suitePointer.description);
      suitePointer = suitePointer.parent;
    }

    if (!result.success) {
      var steps = specResult.failedExpectations;
      for (var i = 0, l = steps.length; i < l; i++) {
        result.log.push(formatFailedStep(steps[i]));
      }
    }

    tc.result(result);
    delete specResult.startTime;
  };
};


var createStartFn = function(tc, jasmineEnvPassedIn) {
  return function(config) {
    // we pass jasmineEnv during testing
    // in production we ask for it lazily, so that adapter can be loaded even before jasmine
    var jasmineEnv = jasmineEnvPassedIn || window.jasmine.getEnv();

    jasmineEnv.addReporter(new KarmaReporter(tc, jasmineEnv));
    jasmineEnv.execute();
  };
};
