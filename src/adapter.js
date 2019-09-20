/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "(createSpecFilter|createStartFn)" }]*/

'use strict'

/**
 * Decision maker for whether a stack entry is considered external to jasmine and karma.
 * @param  {String}  entry Error stack entry.
 * @return {Boolean}       True if external, False otherwise.
 */
function isExternalStackEntry (entry) {
  return !!entry &&
  // entries related to jasmine and karma-jasmine:
  !/\/(jasmine-core|karma-jasmine)\//.test(entry) &&
  // karma specifics, e.g. "at http://localhost:7018/karma.js:185"
  !/\/(karma.js|context.html):/.test(entry)
}

/**
 * Returns relevant stack entries.
 * @param  {Array} stack frames
 * @return {Array}        A list of relevant stack entries.
 */
function getRelevantStackFrom (stack) {
  var filteredStack = []
  var relevantStack = []

  for (var i = 0; i < stack.length; i += 1) {
    if (isExternalStackEntry(stack[i])) {
      filteredStack.push(stack[i])
    }
  }

  // If the filtered stack is empty, i.e. the error originated entirely from within jasmine or karma, then the whole stack
  // should be relevant.
  if (filteredStack.length === 0) {
    filteredStack = stack
  }

  for (i = 0; i < filteredStack.length; i += 1) {
    if (filteredStack[i]) {
      relevantStack.push(filteredStack[i])
    }
  }

  return relevantStack
}

/**
 * Custom formatter for a failed step.
 *
 * Different browsers report stack trace in different ways. This function
 * attempts to provide a concise, relevant error message by removing the
 * unnecessary stack traces coming from the testing framework itself as well
 * as possible repetition.
 *
 * @see    https://github.com/karma-runner/karma-jasmine/issues/60
 * @param  {Object} step Step object with stack and message properties.
 * @return {String}      Formatted step.
 */
function formatFailedStep (step) {
  var relevantMessage = []
  var relevantStack = []

  // Safari/Firefox seems to have no stack trace,
  // so we just return the error message and if available
  // construct a stacktrace out of filename and lineno:
  if (!step.stack) {
    if (step.filename) {
      var stackframe = step.filename
      if (step.lineno) {
        stackframe = stackframe + ':' + step.lineno
      }
      relevantStack.push(stackframe)
    }
    relevantMessage.push(step.message)
    return relevantMessage.concat(relevantStack).join('\n')
  }

  // Remove the message prior to processing the stack to prevent issues like
  // https://github.com/karma-runner/karma-jasmine/issues/79
  var stackframes = step.stack.split('\n')
  var messageOnStack = null
  if (stackframes[0].indexOf(step.message) !== -1) {
    // Remove the message if it is in the stack string (eg Chrome)
    messageOnStack = stackframes.shift()
  }
  // Filter frames
  var relevantStackFrames = getRelevantStackFrom(stackframes)
  if (messageOnStack) {
    // Put the message back if we removed it.
    relevantStackFrames.unshift(messageOnStack)
  } else {
    // The stack did not have the step.message so add it.
    relevantStackFrames.unshift(step.message)
  }

  return relevantStackFrames.join('\n')
}

function SuiteNode (name, parent) {
  this.name = name
  this.parent = parent
  this.children = []

  this.addChild = function (name) {
    var suite = new SuiteNode(name, this)
    this.children.push(suite)
    return suite
  }
}

function processSuite (suite, pointer) {
  var child
  var childPointer

  for (var i = 0; i < suite.children.length; i++) {
    child = suite.children[i]

    if (child.children) {
      childPointer = pointer[child.description] = {_: []}
      processSuite(child, childPointer)
    } else {
      if (!pointer._) {
        pointer._ = []
      }
      pointer._.push(child.description)
    }
  }
}

function getAllSpecNames (topSuite) {
  var specNames = {}

  processSuite(topSuite, specNames)

  return specNames
}

/**
 * Very simple reporter for Jasmine.
 */
function KarmaReporter (tc, jasmineEnv) {
  var currentSuite = new SuiteNode()

  // Save link on native Date object
  // because user can mock it
  var _Date = Date
  var startTimeCurrentSpec = new _Date().getTime()

  function handleGlobalErrors (result) {
    if (result.failedExpectations && result.failedExpectations.length) {
      var message = 'An error was thrown in afterAll'
      var steps = result.failedExpectations
      for (var i = 0, l = steps.length; i < l; i++) {
        message += '\n' + formatFailedStep(steps[i])
      }

      tc.error(message)
    }
  }

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

  this.jasmineStarted = function (data) {
    // TODO(vojta): Do not send spec names when polling.
    tc.info({
      total: data.totalSpecsDefined,
      specs: getAllSpecNames(jasmineEnv.topSuite())
    })
  }

  this.jasmineDone = function (result) {
    result = result || {}

    // Any errors in top-level afterAll blocks are given here.
    handleGlobalErrors(result)

    tc.complete({
      order: result.order,
      coverage: window.__coverage__
    })
  }

  this.suiteStarted = function (result) {
    currentSuite = currentSuite.addChild(result.description)
  }

  this.suiteDone = function (result) {
    // In the case of xdescribe, only "suiteDone" is fired.
    // We need to skip that.
    if (result.description !== currentSuite.name) {
      return
    }

    // Any errors in afterAll blocks are given here, except for top-level
    // afterAll blocks.
    handleGlobalErrors(result)

    currentSuite = currentSuite.parent
  }

  this.specStarted = function () {
    startTimeCurrentSpec = new _Date().getTime()
  }

  this.specDone = function (specResult) {
    var skipped = specResult.status === 'disabled' || specResult.status === 'pending' || specResult.status === 'excluded'

    var result = {
      fullName: specResult.fullName,
      description: specResult.description,
      id: specResult.id,
      log: [],
      skipped: skipped,
      disabled: specResult.status === 'disabled' || specResult.status === 'excluded',
      pending: specResult.status === 'pending',
      success: specResult.failedExpectations.length === 0,
      suite: [],
      time: skipped ? 0 : new _Date().getTime() - startTimeCurrentSpec,
      executedExpectationsCount: specResult.failedExpectations.length + specResult.passedExpectations.length
    }

    // generate ordered list of (nested) suite names
    var suitePointer = currentSuite
    while (suitePointer.parent) {
      result.suite.unshift(suitePointer.name)
      suitePointer = suitePointer.parent
    }

    if (!result.success) {
      var steps = specResult.failedExpectations
      for (var i = 0, l = steps.length; i < l; i++) {
        result.log.push(formatFailedStep(steps[i]))
      }
    }

    // When failSpecWithNoExpectations is true, Jasmine will report specs without expectations as failed
    if (result.executedExpectationsCount === 0 && specResult.status === 'failed') {
      result.success = false
      result.log.push('Spec has no expectations')
    }

    tc.result(result)
    delete specResult.startTime
  }
}

/**
 * Extract grep option from karma config
 * @param {[Array|string]} clientArguments The karma client arguments
 * @return {string} The value of grep option by default empty string
 */
var getGrepOption = function (clientArguments) {
  var grepRegex = /^--grep=(.*)$/

  if (Object.prototype.toString.call(clientArguments) === '[object Array]') {
    var indexOfGrep = indexOf(clientArguments, '--grep')

    if (indexOfGrep !== -1) {
      return clientArguments[indexOfGrep + 1]
    }

    return map(filter(clientArguments, function (arg) {
      return grepRegex.test(arg)
    }), function (arg) {
      return arg.replace(grepRegex, '$1')
    })[0] || ''
  } else if (typeof clientArguments === 'string') {
    var match = /--grep=([^=]+)/.exec(clientArguments)

    return match ? match[1] : ''
  }
}

var createRegExp = function (filter) {
  filter = filter || ''
  if (filter === '') {
    return new RegExp() // to match all
  }

  var regExp = /^[/](.*)[/]([gmixXsuUAJD]*)$/ // pattern to check whether the string is RegExp pattern

  var parts = regExp.exec(filter)
  if (parts === null) {
    return new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')) // escape functional symbols
  }

  var patternExpression = parts[1]
  var patternSwitches = parts[2]
  return new RegExp(patternExpression, patternSwitches)
}

/**
 * Create jasmine spec filter
 * @param {Object} options Spec filter options
 */
var KarmaSpecFilter = function (options) {
  var filterPattern = createRegExp(options && options.filterString())

  this.matches = function (specName) {
    return filterPattern.test(specName)
  }
}

/**
 * Configure jasmine specFilter
 *
 * This function is invoked from the wrapper.
 * @see  adapter.wrapper
 *
 * @param {Object} config The karma config
 * @param {Object} jasmineEnv jasmine environment object
 */
var createSpecFilter = function (config, jasmineEnv) {
  var karmaSpecFilter = new KarmaSpecFilter({
    filterString: function () {
      return getGrepOption(config.args)
    }
  })

  var specFilter = function (spec) {
    return karmaSpecFilter.matches(spec.getFullName())
  }

  jasmineEnv.configure({ specFilter: specFilter })
}

/**
 * Karma starter function factory.
 *
 * This function is invoked from the wrapper.
 * @see  adapter.wrapper
 *
 * @param  {Object}   karma        Karma runner instance.
 * @param  {Object}   [jasmineEnv] Optional Jasmine environment for testing.
 * @return {Function}              Karma starter function.
 */
function createStartFn (karma, jasmineEnv) {
  var clientConfig = karma.config || {}
  var jasmineConfig = clientConfig.jasmine || {}

  jasmineEnv = jasmineEnv || window.jasmine.getEnv()

  jasmineEnv.configure(jasmineConfig)

  window.jasmine.DEFAULT_TIMEOUT_INTERVAL = jasmineConfig.timeoutInterval ||
    window.jasmine.DEFAULT_TIMEOUT_INTERVAL

  // This function will be assigned to `window.__karma__.start`:
  return function () {
    jasmineEnv.addReporter(new KarmaReporter(karma, jasmineEnv))
    jasmineEnv.execute()
  }
}

function indexOf (collection, find, i /* opt*/) {
  if (collection.indexOf) {
    return collection.indexOf(find, i)
  }

  if (i === undefined) { i = 0 }
  if (i < 0) { i += collection.length }
  if (i < 0) { i = 0 }
  for (var n = collection.length; i < n; i++) {
    if (i in collection && collection[i] === find) {
      return i
    }
  }
  return -1
}

function filter (collection, filter, that /* opt*/) {
  if (collection.filter) {
    return collection.filter(filter, that)
  }

  var other = []
  var v
  for (var i = 0, n = collection.length; i < n; i++) {
    if (i in collection && filter.call(that, v = collection[i], i, collection)) {
      other.push(v)
    }
  }
  return other
}

function map (collection, mapper, that /* opt*/) {
  if (collection.map) {
    return collection.map(mapper, that)
  }

  var other = new Array(collection.length)
  for (var i = 0, n = collection.length; i < n; i++) {
    if (i in collection) {
      other[i] = mapper.call(that, collection[i], i, collection)
    }
  }
  return other
}
