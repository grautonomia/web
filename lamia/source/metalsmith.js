'use strict';

var fileMetadata = require('metalsmith-filemetadata');
var snippet      = require('metalsmith-snippet');
var wordcount    = require('metalsmith-word-count');

var setProperty = require('./plugins').setProperty;
var unorphan    = require('./plugins').unorphan;
var hyphenate   = require('./plugins').hyphenate;

function generateId(filename, filedata, ms) {
    var locales = ms.metadata().locales;
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

module.exports.preMarkdown = function (ms, config) {
};

module.exports.postMarkdown = function (ms, config) {
    ms.use(setProperty('id', generateId));
    ms.use(setProperty('disqus_id', generateDisqusId));
    ms.use(snippet({ maxLength: 450 }));
    ms.use(wordcount({ raw: true }));
    ms.use(fileMetadata([
        { pattern: 'articles/*', preserve: true, metadata: { layout: 'article.jade', allow_comments: true, type: 'article', authors: ['GRA'], tags: ['gra'] } },
        { pattern: 'events/*', preserve: true, metadata: { layout: 'page.jade', type: 'event' } },
        { pattern: 'pages/*', preserve: true, metadata: { layout: 'page.jade', type: 'page' } },
    ]));
    ms.use(function (files, ms, done) {
        for (var file in files) {
            if (files[file].type == 'event') {
                files[file].timestamp = files[file].date.getTime();
                files[file].hrefId = files[file].date.toJSON().substr(0, 10).replace(/-/g, '') +'-'+ files[file].id;
            }
        }

        done();
    });
};

module.exports.postLayout = function (ms, config) {
    if (config.env != 'dev') {
        ms.use(unorphan({
            select: 'a, p, blockquote, span, li, h1, h2, h3, h4, h5, h6',
            not:    '[data-dont-unorphan]',
            br:     true,
        }));
        ms.use(hyphenate({
            select:  'p, span, strong, em, ul > li, li > a, p > a',
            not:     '[data-dont-hyphenate], [data-dont-hyphenate] li, blockquote p',
            locales: config.i18n.locales,
        }));
    }
};

module.exports.viewHelpers = function (config) {
    return {};
};
