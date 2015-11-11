module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ngAnnotate: {
      build: {
        files: {
          'dist/<%= pkg.name %>.js': ['src/**/*.js']
        }
      }
    },
    uglify: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js',
      }
    },
    watch: {
      build: {
        options: {
          livereload: 2342
        },
        files: ['demo/*.css', 'src/**/*.js', 'demo/*.html', 'demo/*.js', 'Gruntfile.js'],
        tasks: ['default']
      },
      use: {
        options: {
          livereload: 2342
        },
        files: ['demo/*.css', 'src/**/*.js', 'demo/*.html', 'demo/*.js', 'Gruntfile.js'],
        tasks: ['use']
      }
    },
    copy: {
      use: {
        src: 'dist/*',
        dest: grunt.option('dest')
      }
    },
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commitFiles: ['-a'],
        pushTo: 'origin'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ng-annotate');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('default', [
    'ngAnnotate',
    'uglify'
  ]);

  grunt.registerTask('default:watch', [
    'default',
    'watch'
  ]);

  grunt.registerTask('use', [
    'default',
    'copy:use'
  ]);

  grunt.registerTask('use:watch', [
    'use',
    'watch:use'
  ]);
};
