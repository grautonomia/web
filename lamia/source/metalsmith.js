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
        { pattern: 'posts/*', preserve: true, metadata: { layout: 'post.jade', allow_comments: true, type: 'post', authors: ['GRA'] } },
        { pattern: 'pages/*', preserve: true, metadata: { layout: 'page.jade', type: 'page' } },
    ]));
};

module.exports.postLayout = function (ms, config) {
};

module.exports.viewHelpers = function (config) {
    return {};
};
