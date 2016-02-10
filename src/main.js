var THREE = require('three');

var ndarray = require('ndarray');
var b = require('./core/b');
var blocks = require('./components/blocks');
var character = require('./components/character');

var app = b();
require('./scenario')(app);
app.start();