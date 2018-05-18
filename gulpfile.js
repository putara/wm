'use strict';

var gulp = require('gulp');
var order = require("gulp-order");
var coffee = require('gulp-coffee');
var sass = require('gulp-sass');
var rimraf = require('rimraf');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var csso = require('gulp-csso');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
  root: './',
  dist: './dist/'
};

paths.coffee = paths.root + 'src/coffee/**/*.coffee';
paths.scss = paths.root + 'src/scss/**/*.scss';
paths.distJs = paths.dist + 'js/';
paths.distCss = paths.dist + 'css/wm.css';

gulp.task('clean:js', function (cb) {
  rimraf(paths.distJs, cb);
});

gulp.task('clean:css', function (cb) {
  rimraf(paths.distCss, cb);
});

gulp.task('clean',gulp.parallel(['clean:js', 'clean:css']));

gulp.task('coffee', function () {
  return gulp.src(paths.coffee)
    .pipe(order([
      '_*.coffee',
      '[^_]*.coffee'
    ]))
    .pipe(sourcemaps.init())
      .pipe(coffee({ bare: true }))
      .pipe(concat('wm.js'))
      .pipe(babel())
    .pipe(gulp.dest(paths.distJs))
      .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.distJs));
});

gulp.task('scss', function () {
  return gulp.src(paths.scss)
    .pipe(order([
      '_*.scss',
      '[^_]*.scss',
      '/themes/**/*.scss'
    ]))
    .pipe(sass())
    .pipe(sourcemaps.init())
      .pipe(concat(paths.distCss))
      .pipe(autoprefixer())
    .pipe(gulp.dest('.'))
      .pipe(csso({ restructure: false, debug: false }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', function () {
  gulp.watch(paths.coffee, gulp.series('coffee'));
  gulp.watch(paths.scss, gulp.series('scss'));
});

gulp.task('default', gulp.parallel(['coffee', 'scss']));
