module.exports = function(){

  var fs = require('./fs-promisified.js');
  var path = require('path');
  var _ = require('underscore');
  var moment = require('moment');
  var URI = require('URIjs');
  var request = require('request-promise');
  var Q = require('bluebird');

  /*
   * You will need to reuse the same paths many times over in the course of this sprint.
   * Consider using the `paths` object below to store frequently used file paths. This way,
   * if you move any files, you'll only need to change your code in one place! Feel free to
   * customize it in any way you wish.
   */

  var paths = {
    'siteAssets' : path.join(__dirname, '../web/public'),
    'archivedSites' : path.join(__dirname, '../archives/sites'),
    'list' : path.join(__dirname, '../archives/sites.txt')
  };

  // Used for stubbing paths for jasmine tests, do not modify
  var initialize = function(pathsObj){
    _.each(pathsObj, function(path, type) {
      paths[type] = path;
    });
  };

  var readListOfUrls = function(){
    return fs.readFile(paths.list, {encoding: 'utf8'})
        .then(function(data){
          return data.split('\n');
        })
  };

  var isUrlInList = function(url){
    return  readListOfUrls()
        .then(function(urls){
          var index = urls.indexOf(url);
          if (index > -1){
            return index + 1;
          } else {
            return null;
          }
        });
  };

  var countLines = function(file){
    return fs.readFile(file, {encoding: 'utf8'})
        .then(function(data){
          return data.split('\n').length;
        });
  };

  var appendAndReturnLineNumber = function(file, data){
    var line;
    return countLines(file)
        .then(function(lineCount) {
          line = lineCount + 1;
          return fs.appendFile(file, '\n' + data)
        })
        .then(function(){
          return line;
        });
  };

  var addUrlToList = function(url){
    return isUrlInList(url)
        .then(function(line) {
          if (line) {
            return line;
          } else {
            return appendAndReturnLineNumber(paths.list, url);
          }
        });
  };

  var urlToArchivePath = function(url){
    var uri = new URI(url);
    return path.join(uri.hostname(), uri.directory(), uri.filename() || '_.html')
  };

  var isUrlArchived = function(url){
    var file = urlToArchivePath(url);
    return fileExists(path.join(paths.archivedSites, file))
        .then(function(result){
          if (result) {
            return file;
          } else {
            return null;
          }
        });
  };

  var fileExists = function(file){
    return fs.stat(file)
        .then(function(){
          return true;
        })
        .catch(function(){
          return false;
        });
  };

  var writeToFile = function(file, data){
    return fs.mkdirp(path.dirname(file))
        .then(function() {
          return fs.writeFile(file, data);
        });
  };

  var writeToArchive = function(url, body){
    body = body + '<!-- ' + moment.utc().toISOString() + ' -->';
    return isUrlArchived(url)
        .then(function(file){
          if(file){
            return incrementArchiveVersion(file);
          }
        })
        .then(function() {
          file = urlToArchivePath(url);
          return writeToFile(path.join(paths.archivedSites, file), body);
        });
  };

  var incrementArchiveVersion = function(file){
    var ext = path.extname(file);
    var base;
    if (isNaN(ext.slice(1))){
      ext = '-1';
      base = file;
    } else {
      base = path.join(path.dirname(file), path.basename(file, ext));
      ext = ext.slice(1);
    }
    ext = parseInt(ext);
    var test = base + '.' + (ext + 1).toString();
    return fileExists(path.join(paths.archivedSites, test))
        .then(function(result){
          if (result){
            return incrementArchiveVersion(test);
          }
        })
        .then(function(){
          return fs.rename(path.join(paths.archivedSites, file), path.join(paths.archivedSites, test));
        });
  };

  var downloadUrl = function(url){
    return request({method: "GET", uri: url, resolveWithFullResponse: true})
        .then(function(res) {
          if (res.statusCode !== 200) {
            throw new Error("Received status code " + res.statusCode + " trying to download " + url);
          }
          return writeToArchive(url, res.body);
        });
  };

  var downloadUrls = function(urls){
    var promises = [];
    for (var i = 0; i < urls.length; i++){
      promises.push(downloadUrl(urls[i]));
    }
    return Q.settle(promises);
  };


  var getArchivedVersions = function(url){
    var ret = [];
    isUrlArchived(url)
        .then(function(file) {
          if (file) {
            var iter = function (f) {
              fs.readFile(path.join(paths.archivedSites, f), {encoding: 'utf8'}).then(function (data) {
                ret.push({
                  url : url,
                  file: f,
                  data: data,
                  date: moment.utc(data.slice(data.lastIndexOf('<!-- ') + 4, data.lastIndexOf(' -->')), moment.ISO_8601)
                });
                var ext = path.extname(f);
                var base = path.join(path.dirname(f), path.basename(f));
                if (isNaN(ext)) {
                  ext = '-1';
                  base = f;
                }
                ext = parseInt(ext);
                iter(base + '.' + (ext + 1).toString());
              }, function (err) {
                d.resolve(ret);
              });
            };
            iter(file);
          } else {
            d.reject('The URL is not archived');
          }
    }, function(err){
      d.reject(err);
    });
    return d.promise;
  };

  return {
    paths: paths,
    initialize: initialize,
    readListOfUrls: readListOfUrls,
    isUrlInList: isUrlInList,
    addUrlToList: addUrlToList,
    isURLArchived: isUrlArchived,
    isUrlArchived: isUrlArchived,
    downloadUrl: downloadUrl,
    downloadUrls: downloadUrls,
    getArchivedVersions: getArchivedVersions
  };
}();
