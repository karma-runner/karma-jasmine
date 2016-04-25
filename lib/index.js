var path = require('path')

var createPattern = function (pattern) {
  return {pattern: pattern, included: true, served: true, watched: false}
}

var initJasmine = function (files, doneToMessageQueue) {
  var jasminePath = path.dirname(require.resolve('jasmine-core'))
  files.unshift(createPattern(path.join(__dirname, '/adapter.js')))
  if (doneToMessageQueue) {
    files.unshift(createPattern(path.join(__dirname, '/done-to-message-queue.js')))
  }
  files.unshift(createPattern(path.join(__dirname, '/boot.js')))
  files.unshift(createPattern(jasminePath + '/jasmine-core/jasmine.js'))
}

initJasmine.$inject = ['config.files', 'config.jasmineDoneToMessageQueue']

module.exports = {
  'framework:jasmine': ['factory', initJasmine]
}
