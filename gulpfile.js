var gulp = require('gulp')
  , minifyCSS = require('gulp-clean-css')
  , uglify = require('gulp-uglify')
  , gulpJade = require('gulp-jade')
  , rename = require('gulp-rename')
  , del = require('del')
  , sass = require('gulp-sass')
  , minifyInline = require('gulp-minify-inline')
  , watch = require('gulp-watch')
  , affected = require('gulp-jade-find-affected')
  , gulpFilter = require('gulp-filter')

  , watchify = require('watchify')
  , browserify = require('browserify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , gutil = require('gulp-util')
  , sourcemaps = require('gulp-sourcemaps')

var paths = {
  jade: ['src/**/*.jade'],
  jadeExcluded: ['*', '!src/include/*.jade'],
  jsBundle: 'src/js/bundle/**/*',
  js: ['src/js/**/*', '!src/js/bundle/**/*', '!src/js/bundle'],
  sass: 'src/css/**/*.s?ss',
  css: 'src/css/**/*.css',
  static: ['src/img/**/*', 'src/font/**/*'],
}

// Dev related tasks

gulp.task('dev-clean', function() {
  return del(['dev/**/*'])
})

gulp.task('dev-jade', ['dev-clean'], function() {
  watch(paths.jade)
    .pipe(affected())
    .pipe(gulpFilter(paths.jadeExcluded))
    .pipe(gulpJade({
      pretty: true,
    }))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('dev/'))
  return gulp.src(paths.jade)
    .pipe(gulpFilter(paths.jadeExcluded))
    .pipe(gulpJade({
      pretty: true,
    }))
    .pipe(rename({extname: '.html'}))
    .pipe(gulp.dest('dev/'))
})

gulp.task('dev-sass', ['dev-clean'], function () {
  watch(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dev/css'))
  return gulp.src(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dev/css'))
})

var browserifyOptions = Object.assign({}, watchify.args, {
  entries: require('glob').sync(paths.jsBundle),
  debug: true
});
var b = watchify(browserify(browserifyOptions));
b.on('update', bundle)
b.on('log', gutil.log)

function bundle() {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dev/js'));
}
gulp.task('dev-bundle-js', ['dev-clean'], bundle)

gulp.task('dev-js', ['dev-clean'], function() {
  watch(paths.js)
    .pipe(gulp.dest('dev/js'))
  return gulp.src(paths.js)
    .pipe(gulp.dest('dev/js'))
})

// Build related tasks

gulp.task('clean', function() {
  return del(['dist'])
})

gulp.task('copy-static', ['clean'], function() {
  return gulp.src(paths.static, {base: 'src/'}).pipe(gulp.dest('dist/'))
})

gulp.task('translate-sass', ['clean'], function () {
  return gulp.src(paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist/css'))

})

gulp.task('compress-css', ['clean', 'translate-sass'], function() {
  return gulp.src('dist/css/**/*.css')
    .pipe(minifyCSS({ keepBreaks: false, keepSpecialComments: 0 }))
    .pipe(gulp.dest('dist/css/'))

})

gulp.task('compress-js', ['clean'], function() {
  return gulp.src(paths.js)
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'))
})

gulp.task('bundle-js', ['clean'], function() {
  return browserify(browserifyOptions).bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
})

gulp.task('translate-jade', ['clean'], function() {
  return gulp.src(paths.jade)
    .pipe(gulpFilter(paths.jadeExcluded))
    .pipe(gulpJade())
    .pipe(rename({extname: '.html'}))
    .pipe(minifyInline())
    .pipe(gulp.dest('dist/'))
})

gulp.task('dev', ['dev-bundle-js', 'dev-js', 'dev-jade', 'dev-sass'], function() {
  var finalhandler = require('finalhandler')
    , http = require('http')
    , serveStatic = require('serve-static')

  var serve = serveStatic('dev', {'index': ['index.html', 'index.htm']})

  var server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res))
  })

  server.listen(3000)

  setTimeout(function() {
    console.info('Latino is running at http://localhost:3000/. Press Ctrl+C to stop.')
  }, 500)
})

gulp.task('build', ['compress-css', 'compress-js', 'bundle-js', 'translate-jade', 'copy-static'])

gulp.task('default', ['dev'])
