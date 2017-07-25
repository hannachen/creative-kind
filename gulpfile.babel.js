'use strict';

import gulp from 'gulp'
import fs from 'fs'
import path from 'path'
import babel from 'gulp-babel'
import gutil from 'gulp-util'
import nodemon from 'gulp-nodemon'
import concat from 'gulp-concat'
import sort from 'gulp-sort'
import rename from 'gulp-rename'
import uglify from 'gulp-uglify'
import sourcemaps from 'gulp-sourcemaps'
import cssmin from 'gulp-cssmin'
import connect from 'gulp-connect'
import modernizr from 'modernizr'
import sass from 'gulp-ruby-sass'
import lodashAutobuild from 'gulp-lodash-autobuild'

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

gulp.task('sass', function () {
  return sass('app/src/styles/**/*.scss')
    .pipe(gulp.dest('public/css'))
    .pipe(connect.reload());
});
gulp.task('vendor-styles', function () {
  return gulp.src([
      'bower_components/sanitize-css/sanitize.css',
      'bower_components/bootstrap-drawer/dist/css/bootstrap-drawer.css',
      'bower_components/bootstrap-tokenfield/dist/css/bootstrap-tokenfield.css',
      'bower_components/slick-carousel/slick/slick.css'
    ])
    .pipe(concat('vendor.min.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('public/css'));
});
gulp.task('styles', [
  'sass',
  'vendor-styles'
]);

// Concatenate & Minify JS
var lodashOptions = {
  target: ".tmp/scripts/vendor/lodash.custom.js",
  settings: {}
};
gulp.task('lodash:autobuild', function() {
  return gulp.src("/app/src/scripts/**", {buffer: false})
    .pipe(lodashAutobuild(lodashOptions))
    .on('error', function (err) {
      console.log('err: ', err)
    })
});
gulp.task('js:vendor', function() {
  return gulp.src([
      '.tmp/scripts/vendor/lodash.custom.js',
      'bower_components/js-cookie/src/js.cookie.js',
      'bower_components/paper/dist/paper-full.js',
      'bower_components/bootstrap/js/dist/util.js',
      'bower_components/bootstrap/js/dist/tab.js',
      'bower_components/bootstrap/js/dist/collapse.js',
      'bower_components/bootstrap-drawer/dist/js/drawer.js',
      'bower_components/bootstrap-tokenfield/dist/bootstrap-tokenfield.js',
      'bower_components/materialize/dist/js/materialize.min.js',
      'bower_components/slick-carousel/slick/slick.js',
      'bower_components/gsap/src/uncompressed/TweenLite.js',
      'bower_components/gsap/src/uncompressed/plugins/ScrollToPlugin.js',
      'bower_components/gsap/src/uncompressed/easing/EasePack.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.min.js'))
    .pipe(uglify({'preserveComments':'license'}).on('error', gutil.log))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('public/js'))
    .pipe(connect.reload());
});
gulp.task('js:main', function() {
  return gulp.src('app/src/scripts/*.js')
    .pipe(babel())
    .pipe(sourcemaps.init())
    .pipe(concat('main.min.js'))
    .pipe(uglify().on('error', gutil.log))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('public/js'))
    .pipe(connect.reload());
});
gulp.task('js:pages', function() {
  var folders = getFolders('app/src/scripts');
  var tasks = folders.map(function(folder) {
    return gulp.src(path.join('app/src/scripts', folder, '/**/*.js'))
      .pipe(sort({ asc: false})) // Sort files that files starting with _ is last in file concat
      .pipe(babel())
      .pipe(sourcemaps.init()) // Init source maps
      .pipe(concat(folder + '.js')) // concat into foldername.js
      .pipe(sourcemaps.write('./maps')) // write to sourcemap
      .pipe(gulp.dest('.tmp/scripts/')) // write to output
      .pipe(rename(folder + '.min.js')) // rename to folder.min.js
      .pipe(gulp.dest('public/js')); // write to output again
  });
  return tasks;
});

gulp.task('scripts', [
  'lodash:autobuild',
  'js:vendor',
  'js:main',
  'js:pages'
]);

gulp.task('watch', function() {
  gulp.watch('app/src/styles/**/*.scss', ['sass']);
  gulp.watch('app/src/scripts/**/*.js', ['scripts']);
});

gulp.task('build-modernizr', function () {
  var fs = require('fs'),
      path = require("path"),
      config = {
        "minify": true,
        "classPrefix": "",
        "options": [
          "domPrefixes",
          "prefixes",
          "addTest",
          "prefixed",
          "prefixedCSS"
        ],
        "feature-detects": [
          "test/audio",
          "test/video",
          "test/audio/loop",
          "test/audio/preload",
          "test/audio/webaudio",
          "test/css/pseudotransitions",
          "test/css/transforms",
          "test/css/transforms3d",
          "test/css/transformstylepreserve3d",
          "test/css/transitions"
        ]
      },
      dest = path.join(__dirname, 'public', 'js', 'modernizr.min.js');

  modernizr.build(config, function(result) {
    fs.writeFileSync(dest, result);
  });
});

gulp.task('develop', function() {
  connect.server({
    root: 'app',
    port: 35729,
    livereload: true
  });
  nodemon({
    script: 'app.js',
    ext: 'js handlebars',
    stdout: false
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if(/^Express server listening on port/.test(chunk)) {
        // connect.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

gulp.task('build', [
  'scripts',
  'vendor-styles',
  'build-modernizr'
]);

gulp.task('default', [
  'sass',
  'develop',
  'watch'
]);
