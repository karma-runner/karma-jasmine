// Do not add new tasks. Grunt is used only for building and will be replaced.
module.exports = function (grunt) {
  grunt.loadTasks('tasks')
  grunt.util.linefeed = '\n'
  grunt.initConfig({
    pkgFile: 'package.json',
    build: {
      adapter: ['src/adapter.js']
    }
  })
}
