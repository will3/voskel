module.exports = function(grunt) {
  grunt.initConfig({
    shell: {
      build: {
        command: 'npm run build'
      },
      publish: {
        command: 'npm run publish'
      },
      open: {
        command: 'open http://localhost:9000/index.html'
      }
    },
    serve: {

    },
    concurrent: {
      dev: ['shell:open', 'serve', 'shell:build'],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-serve');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('publish', ['shell:publish', 'shell:open', 'serve']);
};