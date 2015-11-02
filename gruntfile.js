var fs = require('fs');

module.exports = function (grunt) {

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // display timing info for tasks
  require('time-grunt')(grunt);

  var config = {
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      scripts: {
        files: ['Gruntfile.js', 'package.json', 'app/**', 'lib/**'],
        tasks: [],
        options: {
          spawn: false,
          livereload: true
        },
      }
    },
    connect: {
      options: {
        open: true,
        hostname: 'localhost',
        base: [
          'app',
          'app/js',
          'app/css',
          './'
        ],
        livereload: 35729,
        debug: true,
        middleware: function (connect, options, middlewares) {
          middlewares.unshift(require('grunt-connect-proxy/lib/utils').proxyRequest);
          return middlewares;
        },
      },
      proxies: [
        {
          context: ['/api'],
          host: 'localhost',
          port: 4201,
          https: true,
          changeOrigin: true,
          xforward: false,
        }
      ],
    }
  };

  grunt.initConfig(config);
  grunt.registerTask('default', [
    'configureProxies',
    'connect',
    'watch'
  ]);
};