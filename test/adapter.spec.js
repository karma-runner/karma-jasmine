/**
 Tests for adapter/jasmine.js
 These tests are executed in browser.
 */

describe('jasmine adapter', function(){
  var Karma = window.__karma__.constructor;


  describe('KarmaReporter', function(){
    var reporter, karma, env, parentSuite, suite, spec;

    beforeEach(function(){
      var jasmine = getJasmineRequireObj().core(jasmineRequire);
      env = jasmine.getEnv();

      karma = new Karma( new MockSocket(), {} );
      reporter = new KarmaReporter(karma, env);

      spyOn(karma, 'result');

      parentSuite = new jasmine.Suite({
        env: env,
        id: 'suite0',
        description: 'Parent Suite'
      });

      suite = new jasmine.Suite({
        env: env,
        id: 'suite1',
        parentSuite: parentSuite,
        description: 'Child Suite'
      });

      spec = new jasmine.Spec({
        id: 'spec0',
        description: 'contains spec with an expectation',
        fn: function(){},
        getSpecName : function(){
          return 'A suite contains spec with an expectation';
        }
      });
    });


    it('should report all spec names', function(){
      spyOn(karma, 'info').andCallFake(function(info){
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

      env.describe('one', function(){
        env.describe('nested', function(){
          env.it('should do something', function(){});
        });
      });

      env.describe('two', function() {
        env.it('should not do anything', function(){});
      });

      reporter.jasmineStarted({totalSpecsDefined: 2});
    });


    it('should report success result', function(){
      karma.result.andCallFake(function(result){
        expect(result.id).toBe(spec.id);
        expect(result.description).toBe('contains spec with an expectation');
        expect(result.suite).toEqual([ 'Parent Suite', 'Child Suite' ]);
        expect(result.success).toBe(true);
        expect(result.skipped).toBe(false);
      });

      reporter.suiteStarted(parentSuite.result);
      reporter.suiteStarted(suite.result);
      reporter.specDone(spec.result);
      expect(karma.result).toHaveBeenCalled();
    });


    it('should report fail result', function(){
      karma.result.andCallFake(function(result){
        expect(result.success).toBe(false);
        expect(result.log.length).toBe(1);
      });

      spec.result.failedExpectations.push( {} );
      reporter.specDone(spec.result);

      expect(karma.result).toHaveBeenCalled();
    });


    it('should remove jasmine-specific frames from the exception stack traces', function(){
      var stack = "Error: Expected 'function' to be 'fxunction'.\n" +
                  "    at new <anonymous> (http://localhost:8080/lib/jasmine/jasmine.js?123412234:102:32)\n" +
                  "    at [object Object].toBe (http://localhost:8080/lib/jasmine/jasmine.js?123:1171:29)\n" +
                  "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)\n" +
                  "    at [object Object].execute (http://localhost:8080/lib/jasmine/jasmine.js?123:1001:15)";

      karma.result.andCallFake(function(result){
        expect(result.log).toEqual([
          "Error: Expected 'function' to be 'fxunction'.\n"+
            "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)"
        ]);
      });

      spec.result.failedExpectations.push({ stack: stack });
      reporter.specDone(spec.result);

      expect(karma.result).toHaveBeenCalled();
    });


    it('should report time for every spec', function(){
      var counter = 3;

      spyOn(Date.prototype, 'getTime').andCallFake(function(){
        return counter++;
      });

      karma.result.andCallFake(function(result){
        expect(result.time).toBe(1); // 4 - 3
      });

      reporter.specStarted(spec.result);
      reporter.specDone(spec.result);

      expect(karma.result).toHaveBeenCalled();
    });
  });



  describe('formatFailedStep', function(){
    it('should prepend the stack with message if browser does not', function(){
      // FF does not have the message in the stack trace

      var step = {
        passed  : false,
        message : 'Jasmine fail message',
        stack   : '@file.js:123\n'
      };

      expect( formatFailedStep(step) ).toMatch( /^Jasmine fail message/ );
    });


    it('should report message if no stack trace', function(){
      // Safari does not have trace

      var step = {
        passed  : false,
        message : 'MESSAGE'
      };

      expect( formatFailedStep(step) ).toBe( 'MESSAGE' );
    });


    it('should remove jasmine-specific frames from the exception stack traces', function(){
      var step = {
        passed  : false,
        message : "Error: Expected 'function' to be 'fxunction'",
        stack   : "Error: Expected 'function' to be 'fxunction'.\n" +
                  "    at new <anonymous> (http://localhost:8080/lib/jasmine/jasmine.js?123412asd:102:32)\n" +
                  "    at [object Object].toBe (http://localhost:8080/lib/jasmine/jasmine.js?12sd3:1171:29)\n" +
                  "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)\n" +
                  "    at [object Object].execute (http://localhost:8080/lib/jasmine/jasmine.js?123:1001:15)"
      };

      var message = "Error: Expected 'function' to be 'fxunction'.\n" +
                      "    at [object Object].<anonymous> (http://localhost:8080/test/resourceSpec.js:2:3)";

      expect( formatFailedStep(step) ).toBe( message );
    });
  });



  describe('startFn', function(){
    var tc, jasmineEnv, start;

    beforeEach(function(){
      tc = new Karma(new MockSocket(), {});

      spyOn(tc, 'info');
      spyOn(tc, 'complete');
      spyOn(tc, 'result');

      jasmineEnv = new jasmine.Env();
      start = createStartFn(tc, jasmineEnv);
    });
  });



  describe('indexOf', function(){
    it('should return index of given item', function(){
      var collection = [ {}, {}, {} ];
      collection.indexOf = null; // so that we can test it even on

      expect(indexOf(collection, {})).toBe(-1);
      expect(indexOf(collection, collection[1])).toBe(1);
      expect(indexOf(collection, collection[2])).toBe(2);
    });
  });

});
