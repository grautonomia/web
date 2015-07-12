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
};

module.exports.showDrafts = function (show) {
    return function (files, ms, done) {
        if (show) {
            for (var file in files) {
                files[file].draft = false;
            }
        }

        done();
    };
};

function loadSrc(pathArr) {
    var fs      = require('fs');
    var resolve = require('path').resolve;

    return fs.readFileSync(resolve.apply(0, pathArr), 'utf-8');
}

module.exports.msJSDOM = function (srcs, cb) {
    var async     = require('async');
    var jsdom     = require('jsdom');
    var serialize = require('jsdom').serializeDocument;
    var jquery    = loadSrc([__dirname, 'node_modules/jquery/dist/jquery.min.js']);

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

module.exports.imgFragments = function (ops) {
    var changeName = true;
    var addClass   = true;
    var classes    = {
        'thumb': 'image-thumb',
        'wide':  'image-wide'
    };

    return module.exports.msJSDOM([], function ($, filename, filedata, next, ms, window) {
        for (var key in classes) {
            $('img[src$=#'+ key +']').each(function () {
                if (addClass) {
                    $(this).parent('figure').addClass(classes[key]);
                }

                if (changeName) {
                    var base = $(this).attr('src').replace(RegExp('#'+ key +'$'), '');
                    var ext  = require('path').extname(base);

                    $(this).attr('src', '/assets/articles/'+ filedata.id +'/pics/'+ base.replace(ext, '_'+key+'.jpg'));
                }
            });
        }

        next();
    });
};

module.exports.hyphenate = function (ops) {
    var srcs = [];

    ops = ops || {};
    ops.locales = ops.locales || [];

    // Add Hypher
    srcs.push(loadSrc([__dirname, 'node_modules/hypher/dist/jquery.hypher.js']));

    // Add locales
    ops.locales.forEach(function (locale) {
        srcs.push(loadSrc([__dirname, 'node_modules/hyphenation-patterns/dist/browser/'+ locale +'.js']));
    });

    return module.exports.msJSDOM(srcs, function ($, filename, filedata, next, ms, window) {
        var locale = $('html').attr('lang');

        if (ops.locales.indexOf(locale) != -1) {
            $(ops.select || '').not(ops.not || '').hyphenate(locale);
        } else {
            throw "Locale not found!";
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
