'use strict';

var Metalsmith   = require('metalsmith');
var branch       = require('metalsmith-branch');
var concat       = require('metalsmith-concat');
var filenameDate = require('metalsmith-date-in-filename');
var drafts       = require('metalsmith-drafts');
var fileMetadata = require('metalsmith-filemetadata');
var fingerprint  = require('metalsmith-fingerprint');
var ignore       = require('metalsmith-ignore');
var pandoc       = require('metalsmith-pandoc');
var permalinks   = require('metalsmith-permalinks');
var sass         = require('metalsmith-sass');
var slug         = require('metalsmith-slug');
var snippet      = require('metalsmith-snippet');
var templates    = require('metalsmith-templates');
var uglify       = require('metalsmith-uglify');
var wordcount    = require('metalsmith-word-count');

// Custom
var setProperty   = require('./plugins').setProperty;
var i18n          = require('./plugins').i18n;
var includeFiles  = require('./plugins').includeFiles;
var mingo         = require('./plugins').mingo;
var multiLanguage = require('./plugins').multiLanguage;

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

function generateId(filename, filedata, ms) {
    var locales = ms.metadata().locales.locales;
    var ext     = require('path').extname(filename);

    return filename.replace('/', '_')
                   .replace(ext, '')
                   .replace(/\d{8}\-/, '')
                   .replace(RegExp('_('+ locales.join('|') +')$'), '');
}

var viewHelpers = {
    prettyDate: function (date) {
        return date.toISOString().substr(0, 10);
    }
};

module.exports = function (isDebug, done) {
    var locale  = 'ca';
    var locales = ['ca', 'es'];
    var vendors = [
        'bower_components/foundation/js/vendor/jquery.js',
        'bower_components/foundation/js/vendor/fastclick.js',
        'bower_components/foundation/js/foundation/foundation.js',
        'bower_components/foundation/js/foundation/foundation.reveal.js',
        'bower_components/unorphan/index.js',
        'node_modules/hypher/dist/jquery.hypher.js',
    ];

    Metalsmith(__dirname)
        .metadata(viewHelpers)
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
        .use(uglify({ removeOriginal: true }))

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
        .use(setProperty('id', generateId))
        .use(slug({ patterns: ['*.md'], lower: true }))
        .use(pandoc())
        .use(snippet({ maxLength: 400 }))
        .use(wordcount({ raw: true }))
        .use(fileMetadata([
            { pattern: 'articles/*', preserve: true, metadata: { template: 'article.jade', allow_comments: true, type: 'article' } }
        ]))
        .use(branch('articles/*')
            .use(permalinks({
                pattern: ':locale/:slug'
            }))
        )
        .use(mingo())
        .use(templates({
            engine:    'jade',
            directory: 'src/templates'
        }))
        .build(done);
};
