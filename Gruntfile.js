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
        command: 'open http://localhost:3000'
      },
      serve: {
        command: 'nodemon index.js'
      }
    },
    concurrent: {
      dev: ['shell:open', 'shell:serve', 'shell:build'],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('default', ['concurrent:dev']);
  grunt.registerTask('publish', ['shell:publish', 'shell:open', 'shell:serve']);
};