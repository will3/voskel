module.exports = function(grunt) {
  grunt.initConfig({
    shell: {
      build: {
        command: 'npm run build'
      }
    },
    serve: {

    },
    concurrent: {
      dev: ['serve', 'shell'],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-serve');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('default', ['concurrent:dev']);
};