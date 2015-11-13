var gulp = require('gulp')
  , minifyCSS = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , gulpJade = require('gulp-jade')
  , rename = require('gulp-rename')
  , del = require('del')
  , jade = require('jade')
  , sass = require('gulp-sass')
  , minifyInline = require('gulp-minify-inline')
  ;

var paths = {
  jade: ['src/**/*.jade', '!src/include/*.jade'],
  js: 'src/js/**/*',
  css: 'src/css/**/*',
  bin: ['src/img*/**/*', 'src/fonts*/**/*'],
};

gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('copy', ['clean'], function() {
  return gulp.src(paths.bin).pipe(gulp.dest('build/'));
});

gulp.task('css', ['clean'], function() {
  return gulp.src(paths.css)
    .pipe(minifyCSS({ keepBreaks: false, keepSpecialComments: 0 }))
    .pipe(gulp.dest('build/css/'))
    ;
});

gulp.task('js', ['clean'], function() {
  return gulp.src(paths.js)
    .pipe(uglify())
    .pipe(gulp.dest('build/js/'))
    ;
});

gulp.task('jade', ['clean'], function() {
  return gulp.src(paths.jade)
    .pipe(gulpJade({jade: jade}))
    .pipe(rename({extname: '.html'}))
    .pipe(minifyInline())
    .pipe(gulp.dest('build/'))
    ;
});

gulp.task('watch-sass', ['sass'], function() {
  gulp.watch(['src/css/**/*.scss', 'src/css/**/*.sass'], ['sass']);
});
gulp.task('sass', function () {
  gulp.src(['src/css/**/*.scss', 'src/css/**/*.sass'])
    .pipe(sass().on('error', sass.logError))
    .pipe(rename({
      suffix: '_sass'
    }))
    .pipe(gulp.dest('src/css'));
});

gulp.task('build', ['css', 'js', 'jade', 'sass', 'copy']);


gulp.task('dev-clean-html', function(cb) {
  del('src/**/*.html', cb);
});

gulp.task('dev-jade', ['dev-clean-html'], function() {
  return gulp.src(paths.jade)
    .pipe(gulpJade({jade: jade}))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('src/'))
    ;
});

gulp.task('dev', ['dev-jade', 'watch-sass'], function() {
  gulp.watch(paths.jade, ['dev-jade']);
});

gulp.task('default', ['dev']);
