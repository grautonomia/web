'use strict';

// Gulp
var argv             = require('minimist')(process.argv.slice(2));
var clearRequire     = require('clear-require');
var gulp             = require('gulp');
var awspublish       = require('gulp-awspublish');
var awspublishRouter = require("gulp-awspublish-router");
var browserSync      = require('browser-sync');
var creds            = require('./s3.json');
var imagemin         = require('gulp-imagemin');
var imageResize      = require('gulp-image-resize');

process.on('uncaughtException', function (err) {
    console.log(err);
});

gulp.task('metalsmith', function (done) {
    clearRequire('./build');
    require('./build')(argv.debug || false, done);
});

gulp.task('images', function () {
    return gulp.src('src/assets/images/*')
        .pipe(imageResize({
            imageMagick: true,
            width: 720,
            upscale: false
        }))
        .pipe(imagemin())
        .pipe(gulp.dest('build/assets/images'));
});

gulp.task('build', gulp.series('metalsmith', 'images'));

gulp.task('reload', function () {
    browserSync.reload();
});

gulp.task('serve', function (done) {
    browserSync({
        notify: true,
        server: {
            baseDir: './build'
        }
    }, done);
});

gulp.task('upload', function () {
    // create a new publisher
    var publisher = awspublish.create({
        key:    creds.access,
        secret: creds.secret,
        bucket: creds.bucket,
        region: creds.region
    });

    return gulp.src('**/*', { cwd: './build/' })
        .pipe(awspublishRouter({
            cache: {
                cacheTime: 300 // cache for 5 minutes by default
            },

            routes: {
                "^assets/(?:.+)\\.(?:js|css|svg|ttf)$": {
                    key: "$&",           // don't modify original key. this is the default
                    gzip: true,          // use gzip for assets that benefit from it
                    cacheTime: 630720000 // cache static assets for 2 years
                },

                "^assets/.+$": {
                    cacheTime: 630720000 // cache static assets for 2 years
                },

                "^.+\\.html": {
                    gzip: true
                },

                // pass-through for anything that wasn't matched by routes above, to be uploaded with default options
                "^.+$": "$&"
            }
        }))
        .pipe(publisher.publish())
        .pipe(publisher.sync())
        .pipe(publisher.cache())
        .pipe(awspublish.reporter());
});

gulp.task('watch', function () {
    gulp.watch(['src/**/*', 'build.js'], gulp.series('build', 'reload'));
});

gulp.task('deploy', gulp.series('build', 'upload'));
gulp.task('default', gulp.series('build', 'serve', 'watch'));
