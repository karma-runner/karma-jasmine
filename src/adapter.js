var formatFailedStep = function(failedExpectation) {

  var stack = failedExpectation.stack;
  var message = failedExpectation.message;
  if (stack) {
    // remove the trailing dot
    var firstLine = stack.substring(0, stack.indexOf('\n') - 1);
    if (message && message.indexOf(firstLine) === -1) {
      stack = message + '\n' + stack;
    }

    // remove jasmine stack entries
    return stack.replace(/\n.+jasmine\.js\?\d*\:.+(?=(\n|$))/g, '');
  }

  return message;
};

var indexOf = function(collection, item) {
  if (collection.indexOf) {
    return collection.indexOf(item);
  }

  for (var i = 0, ii = collection.length; i < ii; i++) {
    if (collection[i] === item) {
      return i;
    }
  }

  return -1;
};


// TODO(vojta): Karma might provide this
var getCurrentTransport = function() {
  // probably running in debug.html (there's no socket.io)
  if (!window.parent.io) {
    return null;
  }

  var location = window.parent.location;
  return window.parent.io.sockets[location.protocol + '//' + location.host].transport.name;
};


/**
 * Very simple reporter for jasmine
 */
var KarmaReporter = function(tc) {

  var getAllSpecNames = function(topLevelSuites) {
    var specNames = {};

    var processSuite = function(suite, pointer) {
      var childSuite;
      var childPointer;

      for (var i = 0; i < suite.suites_.length; i++) {
        childSuite = suite.suites_[i];
        childPointer = pointer[childSuite.description] = {};
        processSuite(childSuite, childPointer);
      }

      pointer._ = [];
      for (var j = 0; j < suite.specs_.length; j++) {
        pointer._.push(suite.specs_[j].description);
      }
    };

    var suite;
    var pointer;
    for (var k = 0; k < topLevelSuites.length; k++) {
      suite = topLevelSuites[k];
      pointer = specNames[suite.description] = {};
      processSuite(suite, pointer);
    }

    return specNames;
  };

  this.jasmineStarted = function(options) {
    var transport = getCurrentTransport();
    // TODO(max): specNames are missing (no way to get them in 2.0.0-rc2, I guess)
    var specNames = [];

    // This structure can be pretty huge and it blows up socke.io connection, when polling.
    // https://github.com/LearnBoost/socket.io-client/issues/569
    if (transport === 'websocket' || transport === 'flashsocket') {
      //specNames = getAllSpecNames(runner.topLevelSuites());
    }

    tc.info({total: options.totalSpecsDefined || 0, specs: specNames});
  };

  this.jasmineDone = function() {
    tc.complete({
      coverage: window.__coverage__
    });
  };

  this.specStarted = function(specResult) {
    specResult.time = new Date().getTime();
  };

  this.specDone = function(specResult) {
    var skipped = specResult.status === 'disabled' || specResult.status === 'pending';

    var suites = [];
    suites.push(specResult.fullName.slice(0, specResult.fullName.length - specResult.description.length - 1));
    suites.push(specResult.description);

    var result = {
      id: specResult.id,
      description: specResult.description,
      suites: suites,
      //fullName: specResult.fullName,
      success: specResult.failedExpectations.length === 0,
      skipped: skipped,
      time: skipped ? 0 : new Date().getTime() - specResult.time,
      log: []
    };

    for (var i = 0; i < specResult.failedExpectations.length; i++) {
      result.log.push(formatFailedStep(specResult.failedExpectations[i]));
    }

    tc.result(result);

    delete specResult.time;

    // memory clean up
    // spec.results_ = null;
    // spec.spies_ = null;
    // spec.queue = null;
};

  this.log = function() {};
};


var createStartFn = function(tc, jasmineEnvPassedIn) {
  return function(config) {
    // we pass jasmineEnv during testing
    // in production we ask for it lazily, so that adapter can be loaded even before jasmine
    var jasmineEnv = jasmineEnvPassedIn || window.jasmine.getEnv();

    jasmineEnv.addReporter(new KarmaReporter(tc));
    jasmineEnv.execute();
  };
};
