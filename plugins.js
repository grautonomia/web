'use strict';

module.exports.multiLanguage = function (ops) {
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

// Plugin
module.exports.i18n = function (ops) {
    var i18n = require('i18n');

    function __(str, data) {
        return i18n.__({ phrase: str, locale: this.locale }, data || {});
    }

    return function (files, ms, done) {
        i18n.configure({
            defaultLocale: ops.default,
            locales:       ops.locales,
            directory:     ms.path(ops.directory)
        });

        for (var file in files) {
            files[file].__ = __.bind(files[file]);
        }

        done();
    };
}

// Plugin
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
}

// Plugin
module.exports.mingo = function (ops) {
    var Mingo = require('mingo');
    var data  = [];
    var metadata;

    ops         = ops || {};
    ops.find    = ops.find || 'find';
    ops.findOne = ops.findOne || 'findOne';

    return function (files, ms, done) {
        metadata = ms.metadata();

        for (var file in files) {
            files[file]._filename = file;
            data.push(files[file]);
        }

        metadata[ops.find] = function (criteria, projection) {
            return Mingo.find(data, criteria, projection);
        };

        metadata[ops.findOne] = function (criteria, projection) {
            return Mingo.find(data, criteria, projection).first();
        };

        done();
    };
};

// Plugin
module.exports.includeFiles = function (includes) {
    var glob         = require('glob');
    var readFileSync = require('fs').readFileSync;
    var relative     = require('path').relative;

    return function (files, ms, done) {
        var directory = ms.directory();

        includes.forEach(function (include) {
            glob.sync(ms.path(include)).forEach(function (match) {
                files[relative(directory, match)] = { contents: readFileSync(match) };
            });
        });

        done();
    };
}
