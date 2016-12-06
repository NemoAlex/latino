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
  , path = require('path')

  , watchify = require('watchify')
  , browserify = require('browserify')
  , source = require('vinyl-source-stream')
  , buffer = require('vinyl-buffer')
  , gutil = require('gulp-util')
  , sourcemaps = require('gulp-sourcemaps')

const PATHS = {
  jade: ['src/**/*.jade'],
  jadeExcluded: ['**/*', '!include/*'],
  jsBundle: 'src/js/bundle/**/*',
  js: ['src/js/**/*', '!src/js/bundle/**/*', '!src/js/bundle'],
  sass: 'src/css/**/*.s?ss',
  css: 'src/css/**/*.css',
  static: ['src/img/**/*', 'src/font/**/*', 'src/assets/**/*'],
}

// Default html file name, change it if necessary
// Like '.html'
const HTML_EXT_NAME = ''

const DEV_SERVER_PORT = '3000'

// Dev related tasks

gulp.task('dev-clean', function () {
  return del(['dev/**/*'])
})

gulp.task('dev-copy-static', ['dev-clean'], function () {
  return gulp.src(PATHS.static, {base: 'src/'}).pipe(gulp.dest('dev/'))
})
gulp.task('dev-css', ['dev-clean'], function () {
  watch(PATHS.css)
    .pipe(gulp.dest('dev/css'))
  return gulp.src(PATHS.css, {base: 'src/'}).pipe(gulp.dest('dev/'))
})

gulp.task('dev-jade', ['dev-clean'], function () {
  watch(PATHS.jade)
    .pipe(affected())
    .pipe(gulpFilter(PATHS.jadeExcluded))
    .pipe(gulpJade({
      pretty: true,
    }))
    .pipe(rename({extname: HTML_EXT_NAME}))
    .pipe(gulp.dest('dev/'))
  return gulp.src(PATHS.jade)
    .pipe(gulpFilter(PATHS.jadeExcluded))
    .pipe(gulpJade({
      pretty: true,
    }))
    .pipe(rename({extname: HTML_EXT_NAME}))
    .pipe(gulp.dest('dev/'))
})

gulp.task('dev-sass', ['dev-clean'], function () {
  watch(PATHS.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dev/css'))
  return gulp.src(PATHS.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dev/css'))
})

var browserifyOptions = Object.assign({}, watchify.args, {
  entries: require('glob').sync(PATHS.jsBundle),
  debug: true
})
var b = watchify(browserify(browserifyOptions))
b.on('update', bundle)
b.on('log', gutil.log)

function bundle () {
  return b.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dev/js'))
}
gulp.task('dev-bundle-js', ['dev-clean'], bundle)

gulp.task('dev-js', ['dev-clean'], function () {
  watch(PATHS.js)
    .pipe(gulp.dest('dev/js'))
  return gulp.src(PATHS.js)
    .pipe(gulp.dest('dev/js'))
})

// Build related tasks

gulp.task('clean', function () {
  return del(['dist'])
})

gulp.task('copy-static', ['clean'], function () {
  return gulp.src(PATHS.static, {base: 'src/'}).pipe(gulp.dest('dist/'))
})

gulp.task('copy-css', ['clean'], function () {
  return gulp.src(PATHS.css, {base: 'src/'}).pipe(gulp.dest('dist/'))
})

gulp.task('translate-sass', ['clean'], function () {
  return gulp.src(PATHS.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist/css'))

})

gulp.task('compress-css', ['clean', 'translate-sass', 'copy-css'], function () {
  return gulp.src('dist/css/**/*.css')
    .pipe(minifyCSS({ keepBreaks: false, keepSpecialComments: 0 }))
    .pipe(gulp.dest('dist/css/'))

})

gulp.task('compress-js', ['clean'], function () {
  return gulp.src(PATHS.js)
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'))
})

gulp.task('bundle-js', ['clean'], function () {
  return browserify(browserifyOptions).bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('translate-jade', ['clean'], function () {
  return gulp.src(PATHS.jade)
    .pipe(gulpFilter(PATHS.jadeExcluded))
    .pipe(gulpJade())
    .pipe(rename({extname: HTML_EXT_NAME}))
    .pipe(minifyInline())
    .pipe(gulp.dest('dist/'))
})

gulp.task('dev', ['dev-bundle-js', 'dev-js', 'dev-jade', 'dev-sass', 'dev-copy-static', 'dev-css'], function () {
  var finalhandler = require('finalhandler')
    , http = require('http')
    , serveStatic = require('serve-static')

  var serve = serveStatic('dev', {
    'index': ['index', 'index.html', 'index.htm'],
    'setHeaders': function (res, p) {
      if (path.extname(p) === HTML_EXT_NAME) res.setHeader('Content-Type', 'text/html')
    }
  })

  var server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res))
  })

  server.listen(DEV_SERVER_PORT)

  setTimeout(function () {
    console.info(`Latino is running at http://localhost:${DEV_SERVER_PORT}/. Press Ctrl+C to stop.`)
  }, 500)
})

gulp.task('build', ['compress-css', 'compress-js', 'bundle-js', 'translate-jade', 'copy-static'])

gulp.task('default', ['dev'])
