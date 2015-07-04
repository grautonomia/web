'use strict';

var marked = require('marked');

var Metalsmith   = require('metalsmith');
var branch       = require('metalsmith-branch');
var concat       = require('metalsmith-concat');
var convert      = require('metalsmith-convert');
var filenameDate = require('metalsmith-date-in-filename');
var drafts       = require('metalsmith-drafts');
var fileMetadata = require('metalsmith-filemetadata');
var fingerprint  = require('metalsmith-fingerprint');
var htmlMinifier = require("metalsmith-html-minifier");
var imagemin     = require('metalsmith-imagemin');
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
var showDrafts    = require('./plugins').showDrafts;
var unorphan      = require('./plugins').unorphan;
var hyphenate     = require('./plugins').hyphenate;
var imgFragments  = require('./plugins').imgFragments;

function generateId(filename, filedata, ms) {
    var locales = ms.metadata().locales.locales;
    var ext     = require('path').extname(filename);
    var parts   = filename.split('/');

    return parts[parts.length - 1].replace(ext, '')
                                  .replace(/\d{8}\-/, '')
                                  .replace(RegExp('_('+ locales.join('|') +')$'), '');
}

function generateDisqusId(filename, filedata, ms) {
    if (filedata.disqus_id) {
        return filedata.disqus_id;
    } else {
        return 'article_'+ filedata.id;
    }
}

var viewHelpers = {
    nl2br: function (str) {
        return str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '<br/>');
    },
    markdown: marked,
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
        'bower_components/tooltipster/js/jquery.tooltipster.js',
    ];

    var MS = Metalsmith(__dirname)
        .use(ignore(['.DS_Store', '*/.DS_Store', 'templates/*', 'translations/*']))

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
            includePaths: [
                'bower_components/font-awesome/scss',
                'bower_components/foundation/scss',
                'bower_components/tooltipster/css',
            ]
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

        // Images
        .use(convert([
            {
                src:        'assets/articles/**/*.{svg,jpg,jpeg,png,gif}',
                target:     'jpg',
                quality:    70,
                resize:     { width: 260, resizeStyle: 'aspectfit' },
                nameFormat: '%b_thumb%e'
            },
            {
                src:        'assets/articles/**/*.{svg,jpg,jpeg,png,gif}',
                target:     'jpg',
                quality:    70,
                resize:     { width: 624, resizeStyle: 'aspectfit' },
                nameFormat: '%b_wide%e',
                remove:     true
            }
        ]))

        // Content
        .use(filenameDate())
        .use(i18n({
            default:   locale,
            locales:   locales,
            directory: 'src/translations'
        }))
        .use(setProperty('id', generateId))
        .use(setProperty('disqus_id', generateDisqusId))
        .use(slug({ patterns: ['*.md'], lower: true }))
        .use(pandoc({ args: ['--smart'] }))
        .use(snippet({ maxLength: 450 }))
        .use(wordcount({ raw: true }))
        .use(fileMetadata([
            { pattern: 'articles/*', preserve: true, metadata: { template: 'article.jade', allow_comments: true, type: 'article', authors: ['GRA'] } },
            { pattern: 'pages/*', preserve: true, metadata: { template: 'page.jade', type: 'page' } },
        ]))
        .use(branch('articles/*')
            .use(permalinks({
                pattern: ':locale/:slug'
            }))
        )
        .use(branch('pages/*')
            .use(permalinks({
                pattern: ':locale/page/:slug'
            }))
        )
        .use(mingo())
        .metadata(viewHelpers)
        .use(templates({
            engine:    'jade',
            directory: 'src/templates'
        }));

    if (!isDebug) {
        // Post processing
        MS.use(unorphan({
            select: 'a, p, blockquote, span, li, h1, h2, h3, h4, h5, h6',
            not:    '[data-dont-unorphan]',
            br:     true,
        }))
        .use(hyphenate({
            select:  'p, span, strong, em, ul > li',
            not:     '[data-dont-hyphenate], [data-dont-hyphenate] li, blockquote p',
            locales: locales,
        }))
        .use(imgFragments())
        .use(htmlMinifier())
        .use(imagemin());
    }


    MS.build(done);
};
