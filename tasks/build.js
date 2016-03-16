module.exports = function (grunt) {
  /**
   * Build given file - wrap it with a function call
   * TODO(vojta): compile with uglify-js
   */
  grunt.registerMultiTask('build', 'Wrap given file into a function call.', function () {
    var src = grunt.file.expand(this.data).pop()
    var dest = src.replace('src/', 'lib/')
    var wrapper = src.replace('.js', '.wrapper')

    grunt.file.copy(wrapper, dest, {process: function (content) {
      var wrappers = content.split(/%CONTENT%\r?\n/)
      return wrappers[0] + grunt.file.read(src) + wrappers[1]
    }})

    grunt.log.ok('Created ' + dest)
  })
}
