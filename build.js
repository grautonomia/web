var _ = require('lodash');

var Metalsmith = require('metalsmith');
var pandoc     = require('metalsmith-pandoc');
var templates  = require('metalsmith-templates');

function i18n(ops) {
    var extname = require('path').extname;

    var pattern = RegExp('.*_('+ ops.locales.join('|') +')(?:\..*)?$');
    var file;

    function getBaseFilename(file) {
        var base = file;
        var ext  = extname(base);

        base = base.replace(RegExp('_('+ ops.locales.join('|') +')(?:'+ ext +')?$'), '_' + ops.main + ext);

        return base;
    }

    return function (files, ms, done) {
        for (file in files) {
            if (pattern.test(file)) {
                var base = getBaseFilename(file);

                // Get main locale file and extend with current locale
                // This lets to have base properties copied to all the locales
                if (base !== file) {
                    files[file] = _.assign({}, files[base], files[file]);
                }
            }
        }

        done();
    };
}

Metalsmith(__dirname)
    .use(i18n({ main: 'ca', locales: ['ca', 'es'] }))
    .use(function (files, ms, done) {
        //console.log(files);
        done();
    })
    .use(pandoc())
    //.use(templates('jade'))
    .build(function (err, files) {
        if (err) {
            throw err;
        }
    });
