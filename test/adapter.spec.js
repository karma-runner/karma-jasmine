/**
 Tests for adapter/jasmine.js
 These tests are executed in browser.
 */
/* global getJasmineRequireObj, jasmineRequire, MockSocket, KarmaReporter */
/* global formatFailedStep, , createStartFn, getGrepOption, KarmaSpecFilter, createSpecFilter */
/* global getRelevantStackFrom: true, isExternalStackEntry: true */

'use strict'

describe('jasmine adapter', function () {
  var Karma
  beforeAll(function () {
    Karma = window.__karma__.constructor
  })

  describe('KarmaReporter', function () {
    var reporter, karma, env, parentSuite, suite, spec

    beforeEach(function () {
      var jasmine = getJasmineRequireObj().core(jasmineRequire)
      env = jasmine.getEnv()

      karma = new Karma(new MockSocket(), null, null, null, {search: ''})
      reporter = new KarmaReporter(karma, env)

      spyOn(karma, 'result')

      parentSuite = new jasmine.Suite({
        env: env,
        id: 'suite0',
        description: 'Parent Suite'
      })

      suite = new jasmine.Suite({
        env: env,
        id: 'suite1',
        parentSuite: parentSuite,
        description: 'Child Suite'
      })

      spec = new jasmine.Spec({
        id: 'spec0',
        description: 'contains spec with an expectation',
        queueableFn: {
          fn: function () {
          }
        },
        getSpecName: function () {
          return 'A suite contains spec with an expectation'
        }
      })
    })

    it('should report all spec names', function () {
      spyOn(karma, 'info').and.callFake(function (info) {
        expect(info.total).toBe(2)
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
        })
      })

      env.describe('one', function () {
        env.describe('nested', function () {
          env.it('should do something', function () {
          })
        })
      })

      env.describe('two', function () {
        env.it('should not do anything', function () {
        })
      })

      reporter.jasmineStarted({totalSpecsDefined: 2})
    })

    it('should report success result', function () {
      karma.result.and.callFake(function (result) {
        expect(result.id).toBe(spec.id)
        expect(result.description).toBe('contains spec with an expectation')
        expect(result.suite).toEqual(['Parent Suite', 'Child Suite'])
        expect(result.success).toBe(true)
        expect(result.skipped).toBe(false)
      })

      reporter.suiteStarted(parentSuite.result)
      reporter.suiteStarted(suite.result)
      reporter.specDone(spec.result)
      expect(karma.result).toHaveBeenCalled()
    })

    it('should report disabled status', function () {
      spec.result.status = 'disabled'

      karma.result.and.callFake(function (result) {
        expect(result.skipped).toBe(true)
        expect(result.disabled).toBe(true)
      })

      reporter.specDone(spec.result)
      expect(karma.result).toHaveBeenCalled()
    })

    it('should report pending status', function () {
      spec.result.status = 'pending'

      karma.result.and.callFake(function (result) {
        expect(result.skipped).toBe(true)
        expect(result.pending).toBe(true)
      })

      reporter.specDone(spec.result)
      expect(karma.result).toHaveBeenCalled()
    })

    it('should report executedExpectCount 0 if no expectations', function () {
      karma.result.and.callFake(function (result) {
        expect(result.executedExpectationsCount).toBe(0)
      })

      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should report fail result', function () {
      karma.result.and.callFake(function (result) {
        expect(result.success).toBe(false)
        expect(result.log.length).toBe(1)
        expect(result.executedExpectationsCount).toBe(1)
      })

      spec.result.failedExpectations.push({})
      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should report errors in afterAll blocks', function () {
      spyOn(karma, 'complete')
      spyOn(karma, 'error')

      var result = {
        failedExpectations: []
      }

      reporter.jasmineDone(result)
      expect(karma.error).not.toHaveBeenCalled()

      result.failedExpectations.push({})

      reporter.jasmineDone(result)
      expect(karma.error).toHaveBeenCalled()
    })

    it('should report executedExpectCount as sum of passed and failed expectations', function () {
      karma.result.and.callFake(function (result) {
        expect(result.executedExpectationsCount).toBe(2)
      })

      spec.result.passedExpectations.push({})
      spec.result.failedExpectations.push({})

      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should remove jasmine-specific frames from the exception stack traces if the trace contains non-jasmine specific frames', function () {
      var step = {}

      step.message = 'Expected true to be false.'
      step.stack = 'Error: Expected true to be false.\n' +
        '    at stack (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1441:17)\n' +
        '    at buildExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1411:14)\n' +
        '    at Spec.Env.expectationResultFactory (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:533:18)\n' +
        '    at Spec.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:293:34)\n' +
        '    at Expectation.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:477:21)\n' +
        '    at Expectation.toBe (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1365:12)\n' +
        '    at /foo/bar/baz.spec.js:23:29\n' +
        '    at /foo/bar/baz.js:18:20\n'

      karma.result.and.callFake(function (result) {
        expect(result.log).toEqual([
          'Expected true to be false.\n' +
          '    at /foo/bar/baz.spec.js:23:29\n' +
          '    at /foo/bar/baz.js:18:20'
        ])
      })

      spec.result.failedExpectations.push(step)
      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should not remove jasmine-specific frames from the exception stack traces if the trace contains no non-jasmine specific frames', function () {
      var step = {}

      step.message = 'Expected true to be false.'
      step.stack = 'Error: Expected true to be false.\n' +
        '    at stack (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1441:17)\n' +
        '    at buildExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1411:14)\n' +
        '    at Spec.Env.expectationResultFactory (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:533:18)\n' +
        '    at Spec.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:293:34)\n' +
        '    at Expectation.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:477:21)\n' +
        '    at Expectation.toBe (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1365:12)\n'

      karma.result.and.callFake(function (result) {
        expect(result.log).toEqual([
          'Expected true to be false.\n' +
          '    at stack (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1441:17)\n' +
          '    at buildExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1411:14)\n' +
          '    at Spec.Env.expectationResultFactory (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:533:18)\n' +
          '    at Spec.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:293:34)\n' +
          '    at Expectation.addExpectationResult (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:477:21)\n' +
          '    at Expectation.toBe (/foo/bar/node_modules/jasmine-core/lib/jasmine-core/jasmine.js:1365:12)'
        ])
      })

      spec.result.failedExpectations.push(step)
      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should remove special top level suite from result', function () {
      karma.result.and.callFake(function (result) {
        expect(result.suite).toEqual(['Child Suite'])
      })

      reporter.suiteStarted({
        id: 'suite0',
        description: 'Jasmine_TopLevel_Suite'
      })
      reporter.suiteStarted(suite.result)
      spec.result.failedExpectations.push({stack: 'stack'})

      reporter.specDone(spec.result)

      expect(karma.result).toHaveBeenCalled()
    })

    it('should report time for every spec', function () {
      var counter = 3

      spyOn(Date.prototype, 'getTime').and.callFake(function () {
        counter += 1
        return counter
      })

      karma.result.and.callFake(function (result) {
        expect(result.time).toBe(1) // 4 - 3
      })

      reporter.specStarted(Object.assign({}, spec.result))
      reporter.specDone(Object.assign({}, spec.result))

      expect(karma.result).toHaveBeenCalled()
    })

    it('should report order on complete', function () {
      var result = {
        order: {
          random: true,
          seed: '4321'
        }
      }

      spyOn(karma, 'complete')

      reporter.jasmineDone(result)

      expect(karma.complete).toHaveBeenCalledWith({
        order: result.order,
        coverage: undefined
      })
    })

    it('should not fail if result is undefined', function () {
      spyOn(karma, 'complete')

      reporter.jasmineDone()

      expect(karma.complete).toHaveBeenCalledWith({
        order: undefined,
        coverage: undefined
      })
    })

    describe('time', function () {
      afterEach(function () {
        jasmine.clock().uninstall()
      })

      it('should report correct time if user mock Date object', function () {
        karma.result.and.callFake(function (result) {
          expect(result.time >= 0).toBe(true)
        })

        reporter.specStarted(spec.result)

        jasmine.clock().mockDate(new Date(0))
        reporter.specDone(spec.result)
      })
    })
  })

  describe('formatFailedStep', function () {
    it('should prepend the stack with message if browser does not', function () {
      // FF does not have the message in the stack trace

      var step = {
        passed: false,
        message: 'Jasmine fail message',
        stack: '@file.js:123\n'
      }

      expect(formatFailedStep(step)).toMatch(/^Jasmine fail message/)
    })

    it('should report message if no stack trace', function () {
      // Safari does not have trace

      var step = {
        passed: false,
        message: 'MESSAGE'
      }

      expect(formatFailedStep(step)).toBe('MESSAGE')
    })

    it('should properly format message containing new-line characters', function () {
      // FF does not have the message in the stack trace

      var step = {
        passed: false,
        message: 'Jasmine fail\nmessage',
        stack: 'Error: Jasmine fail\nmessage\n@file.js:123'
      }

      expect(formatFailedStep(step)).toMatch('Jasmine fail\nmessage\n@file.js:123')
    })
  })

  describe('startFn', function () {
    var tc
    var jasmineEnv
    var jasmineConfig

    beforeEach(function () {
      jasmineConfig = {}

      tc = new Karma(new MockSocket(), {}, null, null, {search: ''})
      tc.config = {jasmine: jasmineConfig}

      spyOn(tc, 'info')
      spyOn(tc, 'complete')
      spyOn(tc, 'result')

      jasmineEnv = new jasmine.Env()
    })

    it('should set random order', function () {
      jasmineConfig.random = true
      spyOn(jasmineEnv, 'randomizeTests')

      createStartFn(tc, jasmineEnv)()

      expect(jasmineEnv.randomizeTests).toHaveBeenCalledWith(true)
    })

    it('should set order seed', function () {
      var seed = '4321'

      jasmineConfig.seed = seed
      spyOn(jasmineEnv, 'seed')

      createStartFn(tc, jasmineEnv)()

      expect(jasmineEnv.seed).toHaveBeenCalledWith(seed)
    })

    it('should set stopOnFailure', function () {
      jasmineConfig.stopOnFailure = true
      spyOn(jasmineEnv, 'throwOnExpectationFailure')

      createStartFn(tc, jasmineEnv)()

      expect(jasmineEnv.throwOnExpectationFailure).toHaveBeenCalledWith(true)
    })

    it('should not set random order if client does not pass it', function () {
      spyOn(jasmineEnv, 'randomizeTests')

      createStartFn(tc, jasmineEnv)()

      expect(jasmineEnv.randomizeTests).not.toHaveBeenCalled()
    })

    it('should not fail if client does not set config', function () {
      tc.config = null

      expect(function () {
        createStartFn(tc, jasmineEnv)()
      }).not.toThrowError()
    })
  })

  describe('isExternalStackEntry', function () {
    it('should be a function', function () {
      expect(typeof isExternalStackEntry).toBe('function')
    })
    it('should return false for empty strings', function () {
      expect(isExternalStackEntry('')).toBe(false)
    })
    it('should return false for strings with "jasmine-core"', function () {
      expect(isExternalStackEntry('/foo/jasmine-core/bar.js')).toBe(false)
    })
    it('should return false for strings with "karma-jasmine"', function () {
      expect(isExternalStackEntry('/foo/karma-jasmine/bar.js')).toBe(false)
    })
    it('should return false for strings with "karma.js"', function () {
      expect(isExternalStackEntry('/foo/karma.js:183')).toBe(false)
    })
    it('should return false for strings with "context.html"', function () {
      expect(isExternalStackEntry('/foo/context.html:13')).toBe(false)
    })
    it('should return true for all other strings', function () {
      expect(isExternalStackEntry('/foo/bar/baz.js:13:1')).toBe(true)
    })
  })

  describe('getRelevantStackFrom', function () {
    it('should be a function', function () {
      expect(typeof getRelevantStackFrom).toBe('function')
    })

    it('should split by newline and return all values for which isExternalStackEntry returns true', function () {
      isExternalStackEntry = jasmine.createSpy('isExternalStackEntry').and.returnValue(true)
      expect(getRelevantStackFrom('a\nb\nc')).toEqual(['a', 'b', 'c'])
    })

    it('should return the all stack entries if every entry is irrelevant', function () {
      isExternalStackEntry = jasmine.createSpy('isExternalStackEntry').and.returnValue(false)
      expect(getRelevantStackFrom('a\nb\nc')).toEqual(['a', 'b', 'c'])
    })

    it('should return only the relevant stack entries if the stack contains relevant entries', function () {
      isExternalStackEntry = jasmine.createSpy('isExternalStackEntry').and.callFake(function (entry) {
        return entry !== 'b'
      })
      expect(getRelevantStackFrom('a\nb\nc')).toEqual(['a', 'c'])
    })
  })

  describe('getGrepOption', function () {
    it('should get grep option from config if args is array', function () {
      expect(getGrepOption(['--grep', 'test'])).toEqual('test')
    })

    it('should return empty string if args does not contain grep option', function () {
      expect(getGrepOption([])).toEqual('')
    })

    it('should get grep option from args if args is string', function () {
      expect(getGrepOption('--grep=test')).toEqual('test')
    })

    it('should get grep option from args if second arg', function () {
      expect(getGrepOption(['--arg1', 'value1', '--grep', 'grepValue'])).toEqual('grepValue')
    })
  })

  describe('KarmaSpecFilter', function () {
    var specFilter

    beforeEach(function () {
      specFilter = new KarmaSpecFilter({
        filterString: function () {
          return 'test'
        }
      })
    })

    it('should create spec filter', function () {
      expect(specFilter).toBeDefined()
    })

    it('should filter spec by name', function () {
      expect(specFilter.matches('bar')).toEqual(false)
      expect(specFilter.matches('test')).toEqual(true)
    })
  })

  describe('createSpecFilter', function () {
    it('should create spec filter in jasmine', function () {
      var jasmineEnvMock = {}
      var karmaConfMock = {
        args: ['--grep', 'test']
      }
      var specMock = {
        getFullName: jasmine.createSpy('getFullName').and.returnValue('test')
      }

      createSpecFilter(karmaConfMock, jasmineEnvMock)

      expect(jasmineEnvMock.specFilter(specMock)).toEqual(true)
    })
  })
})
