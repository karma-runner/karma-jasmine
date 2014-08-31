var path = require('path');

var createPattern = function(path) {
  return {pattern: path, included: true, served: true, watched: false};
};

var initJasmine = function(files) {
  var jasminePath = path.dirname(require.resolve('jasmine-core'));
  files.unshift(createPattern(__dirname + '/adapter.js'));
  files.unshift(createPattern(__dirname + '/boot.js'));
  files.unshift(createPattern(jasminePath + '/jasmine-core/jasmine.js'));
};

initJasmine.$inject = ['config.files'];

module.exports = {
  'framework:jasmine': ['factory', initJasmine]
};
