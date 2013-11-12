/**
 Tests for adapter/jasmine.js
 These tests are executed in browser.
 */

describe('jasmine adapter', function() {

  var Karma = window.__karma__.constructor;

  describe('KarmaReporter', function() {
    var karma, reporter, spec, specResult;

    beforeEach(function() {
      karma = new Karma(new MockSocket(), {});
      reporter = new KarmaReporter(karma);
      spyOn(karma, 'result');

      spec = new j$.Spec({
        id: 'id',
        description: "should test",
        getSpecName: function() {
          return "parent child should test"
        },
        fn: function() {}
      });

      specResult = {
        id: spec.id,
        description: spec.description,
        fullName: spec.getFullName(),
        failedExpectations: []
      };
    });

    // TODO(max): This test is failing, see adapter.cs
    xit('should report all spec names', function() {
      spyOn(karma, 'info').and.callFake(function(info) {
        expect(info.total).toBe(2);
        expect(info.specs).toEqual({
          one: {
            nested: {
              _: ['should do something']
            },
            _: []
          },
          two: {
            _: ['should not do anything']
          }
        });
      });

      env.describe('one', function() {
        env.describe('nested', function() {
          env.it('should do something', function() {});
        });
      });

      env.describe('two', function() {
        env.it('should not do anything', function() {});
      });

      reporter.reportRunnerStarting(env.currentRunner());
    });


    it('should report success result', function() {
      karma.result.and.callFake(function(result) {
        expect(result.id).toBe(spec.id);
        expect(result.description).toBe('should test');
        // Note(max): Is it a problem that we are not expecting ['parent', 'child', 'should test']
        expect(result.suites).toEqual(['parent child', 'should test']);
        expect(result.success).toBe(true);
        expect(result.skipped).toBe(false);
      });

      reporter.specDone(specResult);

      expect(karma.result).toHaveBeenCalled();
    });


    it('should report failed result', function() {
      karma.result.and.callFake(function(result) {
        expect(result.success).toBe(false);
        expect(result.log.length).toBe(1);
      });

      specResult.failedExpectations.push({});
      reporter.specDone(specResult);

      expect(karma.result).toHaveBeenCalled();
    });


    it('should remove jasmine-specific frames from the exception stack traces', function() {
      var stack = "Error: Expected 'function' to be 'fxunction'.\n" +
        "    at new <anonymous> (http://localhost:8080/lib/jasmine/jasmine.js?123412234:102:32)\n" +
        "    at [object Object].toBe (http://localhost:8080/lib/jasmine/jasmine.js?123:1171:29)\n" +
        "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)\n" +
        "    at [object Object].execute (http://localhost:8080/lib/jasmine/jasmine.js?123:1001:15)";

      karma.result.and.callFake(function(result) {
        expect(result.log).toEqual([
          "Error: Expected 'function' to be 'fxunction'.\n"+
            "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)"
        ]);
      });

      specResult.failedExpectations.push({
        stack: stack
      });
      reporter.specDone(specResult);

      expect(karma.result).toHaveBeenCalled();
    });


    it('should report time for every spec', function() {
      var counter = 3;
      spyOn(Date.prototype, 'getTime').and.callFake(function() {
        return counter++;
      });

      karma.result.and.callFake(function(result) {
        expect(result.time).toBe(1); // 4 - 3
      });

      reporter.specStarted(specResult);
      reporter.specDone(specResult);

      expect(karma.result).toHaveBeenCalled();
    });
  });


  describe('formatFailedStep', function() {

    it('should prepend the stack with message if browser does not', function() {
      // FF does not have the message in the stack trace
      expect(formatFailedStep({
        passed: false,
        message: 'Jasmine fail message',
        stack: '@file.js:123\n'
      })).toMatch(/^Jasmine fail message/);
    });

    it('should report message if no stack trace', function() {
      // Safari does not have trace
      expect(formatFailedStep({
        passed: false,
        message: 'MESSAGE'
      })).toBe('MESSAGE');
    });

    it('should remove jasmine-specific frames from the exception stack traces', function() {
      expect(formatFailedStep({
        passed: false,
        message: "Error: Expected 'function' to be 'fxunction'",
        stack: "Error: Expected 'function' to be 'fxunction'.\n" +
                 "    at new <anonymous> (http://localhost:8080/lib/jasmine/jasmine.js?123412234:102:32)\n" +
                 "    at [object Object].toBe (http://localhost:8080/lib/jasmine/jasmine.js?123:1171:29)\n" +
                 "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)\n" +
                 "    at [object Object].execute (http://localhost:8080/lib/jasmine/jasmine.js?123:1001:15)"
      })).toBe(
        "Error: Expected 'function' to be 'fxunction'.\n" +
        "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)"
      );
    });
  });


  describe('startFn', function() {
    var tc, jasmineEnv, start;

    beforeEach(function() {
      tc = new Karma(new MockSocket(), {});

      spyOn(tc, 'info');
      spyOn(tc, 'complete');
      spyOn(tc, 'result');

      jasmineEnv = new j$.Env();
      start = createStartFn(tc, jasmineEnv);
    });
  });


  describe('indexOf', function() {
    it('should return index of given item', function() {
      var collection = [{}, {}, {}];
      collection.indexOf = null; // so that we can test it even on

      expect(indexOf(collection, {})).toBe(-1);
      expect(indexOf(collection, collection[1])).toBe(1);
      expect(indexOf(collection, collection[2])).toBe(2);
    });
  });
});
