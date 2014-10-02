module.exports = function(){
  var path = require('path');
  var archive = require('../helpers/archive-helpers');
  var express = require('express');
  var app = express();



  // require more modules/folders here!

  var handleRequest = function (req, res) {









    res.end(archive.paths.list);
  };

  return app;
}();


