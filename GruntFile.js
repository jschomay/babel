module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-open');
    // grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8080,
                    base: './deploy'
                }
            }
        },
        browserify: {
            dist: {
                src: ["src/game/**/*.js"],
                dest: 'deploy/js/game.js'
            }
        },
        // concat: {
        //     dist: {
        //         src: [  "src/lib/**/*.js",
        //             "src/game/**/*.js"
        //              ],
        //         dest: 'deploy/js/game.js'
        //     }
        // },
        // watch: {
        //     files: 'src/**/*.js',
        //     tasks: ['browserify']
        // },
        watch: {
            options: {
              livereload: true,
            },
            files: ['src/**/*.js', 'deploy/css/*', 'deploy/assets/**/*'],
            tasks: ['browserify']
          },
        open: {
            dev: {
                path: 'http://localhost:8080/index.html'
            }
        }
    });

    grunt.registerTask('default', ['browserify', 'connect', 'open', 'watch']);

}