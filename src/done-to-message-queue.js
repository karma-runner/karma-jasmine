function shimJasmineItDoneToMessageQueueIfAsync(global) {
  var oldIt = global.it

  function puntToMessageQueueIfAsync(fn) {
    if (fn.length === 0) { // same logic as is used in jasmine to determine if done param should be provided to test fn
      return fn
    }

    return function (done) {
      var puntedDone = function () { setTimeout(done) }
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
