'use strict';

var Metalsmith   = require('metalsmith');
var branch       = require('metalsmith-branch');
var concat       = require('metalsmith-concat');
var drafts       = require('metalsmith-drafts');
var fileMetadata = require('metalsmith-filemetadata');
var fingerprint  = require('metalsmith-fingerprint');
var ignore       = require('metalsmith-ignore');
var pandoc       = require('metalsmith-pandoc');
var permalinks   = require('metalsmith-permalinks');
var sass         = require('metalsmith-sass');
var templates    = require('metalsmith-templates');
var uglify       = require('metalsmith-uglify');
var wordcount    = require('metalsmith-word-count');

function locales(ops) {
    var extname = require('path').extname;

    var pattern = RegExp('.*_('+ ops.locales.join('|') +')(?:\..*)?$');
    var file;

    function getBaseFilename(file) {
        var base = file;
        var ext  = extname(base);

        base = base.replace(RegExp('_('+ ops.locales.join('|') +')(?:'+ ext +')?$'), '_' + ops.default + ext);

        return base;
    }

    function getAltFilename(file, fromLocale, toLocale) {
        var ext = extname(file);

        return file.replace('_'+ fromLocale + ext, '_'+ toLocale + ext);
    }

    function getLocale(file) {
        return file.match(pattern)[1];
    }

    function merge(src, dest) {
        for (var key in src) {
            if (!dest.hasOwnProperty(key)) {
                dest[key] = src[key];
            }
        }
    }

    return function (files, ms, done) {
        ms.locales = ops;

        for (file in files) {
            if (pattern.test(file)) {
                var base = getBaseFilename(file);

                files[file].locale = getLocale(file);

                // Add missing properties from base locale
                // This lets to have base some generic properties
                // applied only in the 'default' locale, e.g.: template
                if (base !== file) {
                    merge(files[base], files[file]);
                }
            } else {
                files[file].locale = ops.default;
            }

            files[file].altFiles = {};

            ops.locales.forEach(function (locale) {
                if (locale != files[file].locale) {
                    files[file].altFiles[locale] = files[getAltFilename(file, files[file].locale, locale)];
                } else {
                    files[file].altFiles[files[file].locale] = files[file];
                }
            });
        }

        done();
    };
}

function showDrafts(show) {
    return function (files, ms, done) {
        if (show) {
            for (var file in files) {
                files[file].draft = false;
            }
        }

        done();
    };
}

function generateIds() {
    var extname = require('path').extname;

    function idFromFilename(file, locales) {
        var ext = extname(file);

        return file.replace('/', '_')
                   .replace(ext, '')
                   .replace(RegExp('_('+ locales.join('|') +')$'), '');
    }

    return function (files, ms, done) {
        for (var file in files) {
            files[file].id = idFromFilename(file, ms.locales.locales);
        }

        done();
    };
}

function includeFiles(includes) {
    var readFileSync = require('fs').readFileSync;
    var path         = require('path');

    return function (files, ms, done) {
        for (var i = 0; i < includes.length; i++) {
            var include = includes[i];
            files[include] = { contents: readFileSync(path.join(__dirname, include)) }
        }

        done();
    };
}

/*
.use(function (files, ms, done) {
    //console.log(files);
    done();
})
*/

module.exports = function (isDebug, done) {
    var vendors = [
        'bower_components/foundation/js/vendor/jquery.js',
        'bower_components/foundation/js/vendor/fastclick.js',
        'bower_components/foundation/js/foundation/foundation.js',
        'bower_components/foundation/js/foundation/foundation.reveal.js',
        'node_modules/unorphan/index.js',
        'node_modules/hypher/dist/jquery.hypher.js'
    ];

    Metalsmith(__dirname)
        // Drafts handling
        .use(showDrafts(isDebug))
        .use(drafts())

        // CSS
        .use(ignore(['.DS_Store', '*/.DS_Store', 'assets/images/*']))
        .use(sass({
            outputDir:    'assets/',
            includePaths: ['bower_components/foundation/scss']
        }))

        // JS
        .use(includeFiles(vendors))
        .use(concat({
            files: vendors.concat([
                'js/main.js',
            ]),
            output: 'assets/main.js'
        }))
        .use(uglify({
            removeOriginal: true
        }))

        // Fingerprint CSS/JS
        .use(fingerprint({ pattern: ['assets/main.css', 'assets/main.min.js'] }))
        .use(ignore(['assets/main.css', 'assets/main.min.js']))

        // Content
        .use(locales({ default: 'ca', locales: ['ca', 'es'] }))
        .use(generateIds())
        .use(pandoc())
        .use(wordcount())
        .use(fileMetadata([
            { pattern: 'articles/*', preserve: true, metadata: { template: 'article.jade' } }
        ]))
        .use(branch('articles/*')
            .use(permalinks({
                pattern: ':locale/:slug'
            }))
        )
        .use(templates('jade'))
        .build(done);
};
