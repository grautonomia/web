'use strict';

var Metalsmith   = require('metalsmith');
var branch       = require('metalsmith-branch');
var fileMetadata = require('metalsmith-filemetadata');
var pandoc       = require('metalsmith-pandoc');
var permalinks   = require('metalsmith-permalinks');
var templates    = require('metalsmith-templates');

function i18n(ops) {
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

Metalsmith(__dirname)
    .use(i18n({ default: 'ca', locales: ['ca', 'es'] }))
    .use(pandoc())
    .use(fileMetadata([
        { pattern: 'articles/*', preserve: true, metadata: { template: 'article.jade' } }
    ]))
    .use(branch('articles/*')
        .use(permalinks({
            pattern: ':locale/:slug'
        }))
    )
    .use(templates('jade'))
    .build(function (err, files) {
        if (err) {
            throw err;
        }
    });
