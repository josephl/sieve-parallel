// require
//
var app = app || {};

requirejs.config({
    shim: {
        'libs/underscore': {
            exports: '_'
        },
        'libs/backbone': {
            deps: ['libs/underscore', 'libs/jquery'],
            exports: 'Backbone'
        },
        'libs/d3': {
            deps: ['libs/jquery'],
            exports: 'd3'
        },
        'bootstrap/js/bootstrap.js': {
            deps: ['libs/jquery']
        },
        'sieve': {
            deps: ['libs/jquery', 'libs/backbone', 'libs/d3', 'bootstrap/js/bootstrap.js']
        }
    }
});

define(
    ['libs/underscore', 'libs/backbone', 'libs/d3', 'bootstrap/js/bootstrap.js', 'sieve'],
    function(jQueryLocal, underscoreLocal,
        backboneLocal, d3Local) {
    }
);
