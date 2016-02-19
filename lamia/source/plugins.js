'use strict';

function loadSrc(pathArr) {
    var fs      = require('fs');
    var resolve = require('path').resolve;

    return fs.readFileSync(resolve.apply(0, pathArr), 'utf-8');
}

module.exports.msJSDOM = function (srcs, cb) {
    var async     = require('async');
    var jsdom     = require('jsdom');
    var serialize = require('jsdom').serializeDocument;
    var jquery    = loadSrc([__dirname, '../bower_components/jquery/dist/jquery.min.js']);

    return function (files, ms, done) {
        async.forEachOf(files, function (filedata, filename, next) {
            if (/\.html/.test(filename)) {
                jsdom.env({
                    html: filedata.contents.toString(),
                    src: [jquery].concat(srcs || []),
                    features: {
                        FetchExternalResources:   false,
                        ProcessExternalResources: false,
                        SkipExternalResources:    true,
                    },
                    done: function (err, window) {
                        if (err) next(err);

                        cb(window.$, filename, filedata, function (err) {
                            filedata.contents = new Buffer(serialize(window.document));
                            next(err);
                        }, ms, window);
                    }
                });
            } else {
                next();
            }
        }, done);
    };
};

module.exports.hyphenate = function (ops) {
    var srcs = [];

    ops = ops || {};
    ops.locales = ops.locales || [];

    // Add Hypher
    srcs.push(loadSrc([__dirname, '../node_modules/hypher/dist/jquery.hypher.js']));

    // Add locales
    ops.locales.forEach(function (locale) {
        srcs.push(loadSrc([__dirname, '../node_modules/hyphenation-patterns/dist/browser/'+ locale +'.js']));
    });

    return module.exports.msJSDOM(srcs, function ($, filename, filedata, next, ms, window) {
        var locale = $('html').attr('lang');

        if (ops.locales.indexOf(locale) != -1) {
            $(ops.select || '').not(ops.not || '').hyphenate(locale);
        } else {
            throw "[ms-hyphenate] Locale '"+ locale +"' not found on '"+ filename +"'!";
        }

        next();
    });
};

module.exports.unorphan = function (ops) {
    var unorphan = require('unorphan');

    ops = ops || {};

    return module.exports.msJSDOM([], function ($, filename, filedata, next, ms, window) {
        unorphan($(ops.select || '').not(ops.not || ''), { br: ops.br || false });
        next();
    });
};

module.exports.setProperty = function (prop, value) {
    return function (files, ms, done) {
        for (var file in files) {
            if (typeof(value) === 'function') {
                files[file][prop] = value(file, files[file], ms);
            } else {
                files[file][prop] = value;
            }
        }

        done();
    };
};
