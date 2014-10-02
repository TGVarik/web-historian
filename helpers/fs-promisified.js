/**
 * Created by tom on 10/2/14.
 */

module.exports = function(){

var fs = require('fs');
var mkdirp = require('mkdirp');
var Q = require('bluebird');

return {
  stat: Q.promisify(fs.stat),
  writeFile: Q.promisify(fs.writeFile),
  appendFile: Q.promisify(fs.appendFile),
  rename: Q.promisify(fs.rename),
  readFile: Q.promisify(fs.readFile),
  mkdirp: Q.promisify(mkdirp)
}


}();