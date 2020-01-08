var gulp = require("gulp"); // GULP
var pug = require("gulp-pug"); // Препроцессор HTML --> JADE/PUG
var clean = require("del"); // Удаление
var plumber = require('gulp-plumber'); // Отслеживание ошибок в галпе
var sourcemap = require("gulp-sourcemaps"); // Source Map
var stylus = require("gulp-stylus"); // Препроцессор CSS --> STYLUS
var postcss = require("gulp-postcss"); // Обработка скомпилированного CSS
var autoprefixer = require("autoprefixer"); // Префиксер
var csso = require("gulp-csso"); // Минификация CSS
var uglify = require('gulp-uglify'); // Минификация JS
var rename = require("gulp-rename"); // Переименование файлов
var posthtml = require("gulp-posthtml"); // Обработка скомпилированного HTML
var include = require("posthtml-include");
var imagemin = require("gulp-imagemin"); // Оптимизация изображений
var webp = require("gulp-webp"); // Конвертация изображений в формат WEBP
var svgstore = require("gulp-svgstore") // Создание SVG-спрайта
var server = require("browser-sync").create(); // Локальный сервер

// Удаляю build

gulp.task("clean", function () {
  return clean("build");
});

// Копирую статичные папки

gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/img/**",
    "source//*.ico"
    ], {
      base: "source"
    })
  .pipe(gulp.dest("build"));
});

// Компилирую HTML

gulp.task('pug', function buildHTML() {
  return gulp.src("source/pug/*.pug")
  .pipe(plumber())
  .pipe(pug({
    pretty: true
  }))
  .pipe(posthtml([
    include()
  ]))
  .pipe(gulp.dest("build"));
});

// Компилирую CSS

gulp.task('style', function () {
  return gulp.src("source/stylus/style.styl")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(stylus())
    .pipe(postcss([ autoprefixer() ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream())
});

// Минификация и объединение JS-файлов

// 1: свой JS

gulp.task("js", function(){
  return gulp.src("source/js/scripts/*.js")
  .pipe(plumber())
  //.pipe(uglify())
  .pipe(rename("main.min.js"))
  .pipe(gulp.dest("build/js"));
});

// 2: Используемые библиотеки

gulp.task("vendor", function(){
  return gulp.src("source/js/vendor/*.js")
  .pipe(plumber())
  .pipe(uglify())
  .pipe(rename("vendor.min.js"))
  .pipe(gulp.dest("build/js"));
});

gulp.task("images", function() {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("source/img"));
});

gulp.task("webp", function () {
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("source/img"));
});

/*gulp.task("sprite", function () {
  return gulp.src("source/img/{icon-*}.svg")
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename("sprite_auto.svg"))
    .pipe(gulp.dest("source/img"));
});*/

gulp.task("sprite", function () {
  return gulp.src("source/img/{icon-*,htmlacademy*}.svg")
    .pipe(svgstore({inlineSvg: true}))
    .pipe(rename("sprite_auto.svg"))
    .pipe(gulp.dest("source/img"));
});

// Локальный сервер

gulp.task("server", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/stylus/**/*.styl", gulp.series("style"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "pug", "refresh"));
  gulp.watch("source/pug/**/*.pug", gulp.series("pug", "refresh"));
  gulp.watch("source/js/**/*.js", gulp.series("js", "refresh"));
});

// Обновление сервера

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("build", gulp.series("clean", "copy", "sprite", "pug", "style", "js", "vendor"));
gulp.task("start", gulp.series("build", "server"));
