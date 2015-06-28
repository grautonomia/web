'use strict';

var Metalsmith   = require('metalsmith');
var branch       = require('metalsmith-branch');
var collections  = require('metalsmith-collections');
var concat       = require('metalsmith-concat');
var filenameDate = require('metalsmith-date-in-filename');
var drafts       = require('metalsmith-drafts');
var fileMetadata = require('metalsmith-filemetadata');
var fingerprint  = require('metalsmith-fingerprint');
var ignore       = require('metalsmith-ignore');
var pandoc       = require('metalsmith-pandoc');
var permalinks   = require('metalsmith-permalinks');
var sass         = require('metalsmith-sass');
var snippet      = require('metalsmith-snippet');
var templates    = require('metalsmith-templates');
var uglify       = require('metalsmith-uglify');
var wordcount    = require('metalsmith-word-count');

// Plugin
function multiLanguage(ops) {
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
        ms.metadata().locales = ops;
        ms.metadata().filterByLocale = function (arr, locale) {
            return arr.filter(function (el, index) {
                return el.locale == locale;
            });
        };

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

        // Index handling
        // Default locale will go in 'index.html'
        // Other index-es in '/:locale/index.html'
        for (file in files) {
            if (/^index/.test(file)) {
                var ext = extname(file);

                if (files[file].locale == ops.default) {
                    files[file].path = '';
                    files['index'+ ext] = files[file];
                } else {
                    files[file].path = files[file].locale +'/';
                    files[files[file].locale + '/index'+ext] = files[file];
                }

                // Remove old entry
                delete files[file];
            }
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

// Plugin
function i18n(ops) {
    var i18n = require('i18n');

    i18n.configure({
        defaultLocale: ops.default,
        locales:       ops.locales,
        directory:     ops.directory
    });

    function __(str, data) {
        return i18n.__({ phrase: str, locale: this.locale }, data || {});
    }

    return function (files, ms, done) {
        for (var file in files) {
            files[file].__ = __.bind(files[file]);
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
                   .replace(/\d{8}\-/, '')
                   .replace(RegExp('_('+ locales.join('|') +')$'), '');
    }

    return function (files, ms, done) {
        for (var file in files) {
            files[file].id = idFromFilename(file, ms.metadata().locales.locales);
        }

        done();
    };
}

// Plugin
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
    var locale  = 'ca';
    var locales = ['ca', 'es'];
    var vendors = [
        'bower_components/foundation/js/vendor/jquery.js',
        'bower_components/foundation/js/vendor/fastclick.js',
        'bower_components/foundation/js/foundation/foundation.js',
        'bower_components/foundation/js/foundation/foundation.reveal.js',
        'bower_components/unorphan/index.js',
        'node_modules/hypher/dist/jquery.hypher.js'
    ];

    Metalsmith(__dirname)
        .use(ignore(['.DS_Store', '*/.DS_Store', 'assets/images/*', 'templates/*', 'translations/*']))

        // Multi-language
        // This must go before drafts, since the secondary locale
        // gets some of its properties from the primary locale.
        // For example `draft`.
        .use(multiLanguage({ default: locale, locales: locales }))

        // Drafts handling
        .use(showDrafts(isDebug))
        .use(drafts())

        // CSS
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

        // Add hash to CSS/JS filename for cache invalidation
        .use(fingerprint({ pattern: ['assets/main.css', 'assets/main.min.js'] }))
        .use(ignore(['assets/main.css', 'assets/main.min.js']))

        // Content
        .use(filenameDate())
        .use(i18n({
            default:   locale,
            locales:   locales,
            directory: 'src/translations'
        }))
        .use(generateIds())
        .use(collections({
            articles: {
                pattern: 'articles/*.md',
                sortBy:  'date',
                reverse: true
            }
        }))
        .use(pandoc())
        .use(snippet({ maxLength: 400 }))
        .use(wordcount({ raw: true }))
        .use(fileMetadata([
            { pattern: 'articles/*', preserve: true, metadata: { template: 'article.jade', allow_comments: true } }
        ]))
        .use(branch('articles/*')
            .use(permalinks({
                pattern: ':locale/:slug'
            }))
        )
        .use(templates({
            engine:    'jade',
            directory: 'src/templates'
        }))
        .build(done);
};
