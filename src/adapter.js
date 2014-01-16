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
  this.result = result;
  this.parent = parent;
  this.children = [];

  this.addChild = function(result) {
    this.children.push(new SuiteNode(result, this));
  };

  this.lastChild = function() {
    return this.children.pop();
  };
};


/**
 * Very simple reporter for jasmine
 */
var KarmaReporter = function(tc) {

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

  this.jasmineStarted = function(data) {
    tc.info({ total: data.totalSpecsDefined, specs: null });
  };


  this.jasmineDone = function() {
    tc.complete({
      coverage: window.__coverage__
    });
  };


  var rootSuite = new SuiteNode({}, null),
      currentSuite = rootSuite;


  this.suiteStarted = function(result){
    currentSuite.addChild(result);
    currentSuite = currentSuite.lastChild();
  };


  this.suiteDone = function(result){
    if (currentSuite === rootSuite) {
      return;
    }

    currentSuite = currentSuite.parent;
  };


  this.specStarted = function(specResult) {
    specResult.time = new Date().getTime();
  };


  this.specDone = function(specResult) {
    var skipped = specResult.status === 'disabled' || specResult.status === 'pending';

    var result = {
      description : specResult.description,
      id          : specResult.id,
      log         : [],
      skipped     : skipped,
      success     : specResult.failedExpectations.length === 0,
      suite       : [],
      time        : skipped ? 0 : new Date().getTime() - specResult.time
    };

    // generate ordered list of (nested) suite names
    var suitePointer = currentSuite;
    while(suitePointer.result.description){
      result.suite.unshift(suitePointer.result.description);
      suitePointer = suitePointer.parent;
    }

    if (!result.success) {
      var steps = specResult.failedExpectations;
      for (var i = 0, l = steps.length; i < l; i++) {
        result.log.push( formatFailedStep(steps[i]) );
      }
    }

    tc.result(result);
    delete specResult.time;
  };

};


var createStartFn = function(tc, jasmineEnvPassedIn) {
  return function(config) {
    // we pass jasmineEnv during testing
    // in production we ask for it lazily, so that adapter can be loaded even before jasmine
    var jasmineEnv = jasmineEnvPassedIn || window.jasmine.getEnv();

    jasmineEnv.addReporter( new KarmaReporter(tc) );
    jasmineEnv.execute();
  };
};
