'use strict';

var gulp = require('gulp');
var Lamia = require('lamia');
var path = require('path');

gulp.registry(new Lamia(path.join(__dirname, '../'), require('./deploy.json')));
