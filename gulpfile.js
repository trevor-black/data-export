﻿var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var sourcemaps = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var sequence = require("run-sequence");
var header = require('gulp-header');
var zip = require('gulp-zip');
var gutil = require("gulp-util");
var fs = require("fs");

gulp.task("angularui", function () {
    return gulp.src(["./node_modules/angular-ui-bootstrap/dist/**"])
      .pipe(gulp.dest("./dist/"));
});

gulp.task("papaparse", function () {
    return gulp.src(["./node_modules/papaparse/papaparse.min.js"])
      .pipe(gulp.dest("./dist/"));
});

gulp.task("angularfilesaver", function () {
    return gulp.src(["./node_modules/angular-file-saver/dist/angular-file-saver.bundle.min.js"])
      .pipe(gulp.dest("./dist/"));
});

// It is important that you include utilities.js first, run.js second and libraries/*.js third. After that, the order is not important.
gulp.task("concat", function () {
    return gulp.src(["./app/modules/*.js", "./app/utilities.js", "./app/app.js", "./app/run.js", "./app/libraries/*.js", "./app/shared/*.js", "./app/pages/**/*.js"])
      .pipe(concat("data-export.js"))
      .pipe(gulp.dest("./dist/"));
});

gulp.task("compress", function () {
    return gulp.src(["./dist/*.js", "!./dist/*.min.js"])
    .pipe(uglify())
     .pipe(rename({
         extname: ".min.js"
     }))
    .pipe(gulp.dest("./dist/"));
});

gulp.task("sourcemap", function () {
    return gulp.src(["./dist/data-export.js"])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest("./dist/"));
});

gulp.task('dist', function (done) {
    sequence('angularui', 'angularfilesaver', 'papaparse', 'concat', 'compress', 'sourcemap', function () {
        var json = JSON.parse(fs.readFileSync('./package.json'));

        // Read the version number
        var version = json.version;
        fs.writeFileSync("./version.html", version, {"encoding": "utf8"})

        // Add headers with the release number to each of the distribution files.
        gulp.src(['./dist/data-export.js', './dist/data-export.min.js', './dist/pages.js', './dist/pages.min.js']).pipe(header("/*\nComecero Data Export version: " + json.version + "\nhttps://comecero.com\nhttps://github.com/comecero/data-export\nCopyright Comecero and other contributors. Released under MIT license. See LICENSE for details.\n*/\n\n")).pipe(gulp.dest('./dist/'));
        done();

    });
});

gulp.task('zip', function (done) {
    var json = JSON.parse(fs.readFileSync('./package.json'));
    var version = fs.readFileSync("./version.html", "utf8").trim();
    if (json.version != version) {
      throw new gutil.PluginError({
          plugin: 'dist',
          message: 'version.html and package.json version do not match'
        });
    }

    return gulp.src(["./**", "!./.git", "!./.vs", "!./.git/**", "!./.gitattributes", "!./settings/**", "!./settings/", "!oauth",
                     "!./*.zip", "!./.gitignore", "!./*.sln", "!./Web.config", "!./Web.Debug.config", "!./node_modules/**"])
      .pipe(zip("data-export-" + version + ".zip"))
      .pipe(gulp.dest("./"));
});
