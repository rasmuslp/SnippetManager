'use strict';

var config = require('./build.config.js');

var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var templateCache = require('gulp-angular-templatecache');
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var notify = require('gulp-notify');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync');
var filter = require('gulp-filter');
var flatten = require('gulp-flatten');
var inlineSource = require('gulp-inline-source');
var autoprefixer = require('gulp-autoprefixer');
var replace = require('gulp-replace');
var ignore = require('gulp-ignore');
var print = require('gulp-print');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');

var filterByExtension = function(extension){
  return filter(function(file){
    return file.path.match(new RegExp('.' + extension + '$'));
  });
};

var onLessError = function(error) {
  notify.onError({
    title:    'Less',
    subtitle: 'Failure!',
    message:  'Error: <%= error.message %>',
    sound:    'Beep'
  })(error);

  this.emit('end');
};

gulp.task('clean', function() {
  del(config.build.base, function() {});
});

gulp.task('bower:js', function() {
  var bowerFiles = mainBowerFiles();

  if(!bowerFiles.length){
    // No main files found. Skipping....
    return;
  }

  return gulp.src(bowerFiles)
  .pipe(filterByExtension('js'))
  .pipe(sourcemaps.init({debug: true}))
  .pipe(concat('vendor.js'))
  .pipe(sourcemaps.write(config.build.maps))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('bower:css', function() {
  var bowerFiles = mainBowerFiles();

  if(!bowerFiles.length){
    // No main files found. Skipping....
    return;
  }

  return gulp.src(bowerFiles)
  .pipe(filterByExtension('css'))
  .pipe(sourcemaps.init({debug: true}))
  .pipe(concat('vendor.css'))
  .pipe(sourcemaps.write(config.build.maps))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('bower:fonts', function() {
  var bowerFiles = mainBowerFiles();

  if(!bowerFiles.length){
    // No main files found. Skipping....
    return;
  }

  return gulp.src(bowerFiles)
  .pipe(ignore.include('**/fonts/*'))
  .pipe(gulp.dest(config.build.fonts));
});

gulp.task('bower:extra:css', function() {
  return gulp.src(config.vendor.css)
  .pipe(sourcemaps.init({debug: true}))
  .pipe(concat('vendorExtra.css'))
  .pipe(sourcemaps.write(config.build.maps))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('bower:custom', ['fontReferenceFix'], function() {});

gulp.task('fontReferenceFix', function() {
  return gulp.src(config.build.base + 'vendor.css')
  .pipe(replace('../fonts/', 'fonts/'))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('bower', function() {
  runSequence('bower:js', 'bower:css', 'bower:fonts', 'bower:extra:css', 'bower:custom');
});

gulp.task('lint', function() {
  return gulp.src(config.src.js)
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(notify(function (file) {
    if (file.jshint.success) {
      // Don't show something if success
      return false;
    } else {
      return 'JShint says to look in the terminal!';
    }
  }));
});

gulp.task('js', ['lint'], function() {
  return gulp.src(config.src.js)
  .pipe(ngAnnotate({
    single_quotes: true
  }))
  .pipe(sourcemaps.init({debug: true}))
  .pipe(concat('app.js'))
  .pipe(sourcemaps.write(config.build.maps))
  .pipe(gulp.dest(config.build.base));
});


gulp.task('templates', function() {
  return gulp.src(config.src.tpl)
  .pipe(changed(config.build.base))
  .pipe(templateCache('templates.js', {
    standalone: true
  }))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('less', function () {
  return gulp.src(config.src.less[0])
  .pipe(plumber({
    errorHandler: onLessError
  }))
  .pipe(flatten())
  .pipe(sourcemaps.init({debug: true}))
  .pipe(less())
  .pipe(autoprefixer({
    browsers: ['> 1%', 'last 2 versions'],
    cascade: true
  }))
  .pipe(sourcemaps.write(config.build.maps))
  .pipe(gulp.dest(config.build.base));
});

gulp.task('imageoptim', function() {
  return gulp.src(config.src.assets)
  .pipe(imagemin({
    svgoPlugins: [{removeUselessStrokeAndFill: false}]
  }))
  .pipe(gulp.dest(config.build.assets));
});

gulp.task('assets', function() {
  return gulp.src(config.src.assets)
  .pipe(gulp.dest(config.build.assets));
});

gulp.task('copy:index', function() {
  return gulp.src([config.src.index])
  .pipe(gulp.dest(config.build.base));
});

gulp.task('copy', ['copy:index'], function() {
  return gulp.src([config.build.base + 'index.html'])
  .pipe(inlineSource())
  .pipe(gulp.dest(config.build.base));
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: config.build.base
    }
  });
});

gulp.task('build', function() {
  return runSequence(['bower', 'js', 'templates', 'assets'], 'less', 'copy');
});

gulp.task('default', function() {
  return runSequence('clean', ['build']);
});

gulp.task('travis', ['build'], function() {});

gulp.task('watch', ['default'], function() {
  gulp.watch(config.src.js, ['js', browserSync.reload]);
  gulp.watch(config.src.tpl, ['templates', browserSync.reload]);
  gulp.watch(config.src.less, ['less', browserSync.reload]);
  gulp.watch(config.src.index, ['copy', browserSync.reload]);

  browserSync({
    server: {
      baseDir: config.build.base
    }
  });
});