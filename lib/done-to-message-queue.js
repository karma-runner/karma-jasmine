(function(global) {

function shimJasmineItDoneToMessageQueueIfAsync(global) {
  var oldIt = global.it

  function puntToMessageQueueIfAsync(fn) {
    if (fn.length === 0) {
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

shimJasmineItDoneToMessageQueueIfAsync(global);

})(typeof window !== 'undefined' ? window : global);
