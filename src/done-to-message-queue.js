/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "(shimJasmineItDoneToMessageQueueIfAsync)" }]*/

'use strict'

function shimJasmineItDoneToMessageQueueIfAsync (global) {
  var oldIt = global.it

  // Save link on native setTimeout function since the user can mock it
  var originalSetTimeout = global.setTimeout

  function puntToMessageQueueIfAsync (fn) {
    if (fn.length === 0) { // same logic as is used in jasmine to determine if done param should be provided to test fn
      return fn
    }

    return function (done) {
      var puntedDone = function () { originalSetTimeout(done) }
      Object.keys(done).forEach(function (key) {
        puntedDone[key] = done[key]
      })
      fn(puntedDone)
    }
  }

  global.it = function (description, fn, timeout) {
    oldIt(description, puntToMessageQueueIfAsync(fn), timeout)
  }
}
