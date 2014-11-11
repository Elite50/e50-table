module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ngAnnotate: {
      build: {
        files: {
          'dist/<%= pkg.name %>.js': ['src/app.js', 'src/directives/e50-table.js', 'src/services/Poll.js']
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
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-ng-annotate');

  grunt.registerTask('default', ['ngAnnotate','uglify']);
};
