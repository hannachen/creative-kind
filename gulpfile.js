var gulp = require('gulp'),
    fs = require('fs'),
    path = require('path'),
    gutil = require('gulp-util'),
    nodemon = require('gulp-nodemon'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    cssmin = require('gulp-cssmin'),
    livereload = require('gulp-livereload'),
    modernizr = require('modernizr'),
    sass = require('gulp-ruby-sass');

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

gulp.task('sass', function () {
  return sass('app/src/styles/**/*.scss')
    .pipe(concat('main.min.css'))
    .pipe(gulp.dest('public/css'))
    .pipe(livereload());
});
gulp.task('vendor-styles', function () {
  return gulp.src([
      'bower_components/normalize-css/normalize.css',
      'bower_components/bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css'
    ])
    .pipe(concat('vendor.min.css'))
    .pipe(cssmin())
    .pipe(gulp.dest('public/css'));
});

// Concatenate & Minify JS
gulp.task('js:vendor', function() {
  return gulp.src([
      'bower_components/jquery/dist/jquery.js',
      'bower_components/lodash/lodash.js',
      'bower_components/paper/dist/paper-full.js',
      'bower_components/bootstrap/js/dist/util.js',
      'bower_components/bootstrap/js/dist/tab.js',
      'bower_components/bootstrap/js/dist/modal.js',
      'bower_components/bootstrap-switch/dist/js/bootstrap-switch.js'
    ])
    .pipe(concat('vendor.min.js'))
    .pipe(uglify({options: {'preserveComments':'all'}}).on('error', gutil.log))
    .pipe(gulp.dest('public/js'))
    .pipe(livereload());
});
gulp.task('js:main', function() {
  return gulp.src('app/src/scripts/*.js')
    .pipe(concat('main.min.js'))
    .pipe(uglify({'outSourceMap': true}).on('error', gutil.log))
    .pipe(gulp.dest('public/js'))
    .pipe(livereload());
});
gulp.task('js:pages', function() {
  var folders = getFolders('app/src/scripts');
  var tasks = folders.map(function(folder) {
    return gulp.src(path.join('app/src/scripts', folder, '/**/*.js'))
      // minify
      .pipe(uglify({'outSourceMap': true}).on('error', gutil.log))
      // concat into foldername.js
      .pipe(concat(folder + '.js'))
      // write to output
      .pipe(gulp.dest('tmp/scripts/'))
      // rename to folder.min.js
      .pipe(rename(folder + '.min.js'))
      // write to output again
      .pipe(gulp.dest('public/js'));
  });
  return tasks;
});

gulp.task('scripts', [
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

gulp.task('develop', function () {
  livereload.listen();
  nodemon({
    script: 'app.js',
    ext: 'js coffee handlebars',
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if(/^Express server listening on port/.test(chunk)){
        livereload.changed(__dirname);
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
