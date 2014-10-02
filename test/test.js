var path = require('path');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var should = chai.should();
var expect = chai.expect;
var assert = chai.assert;
var request = require('supertest');
var archive = require('../helpers/archive-helpers');
var fs = require('fs');

archive.initialize({
  list : path.join(__dirname, "/testdata/sites.txt"),
  archivedSites: path.join(__dirname, "/testdata/sites")
});

beforeEach(function(){
  fs.writeFileSync(archive.paths.list, "example1.com\nexample2.com");
});

afterEach(function(){
  fs.writeFileSync(archive.paths.list, "example1.com\nexample2.com");
});

describe("archive-helpers", function(){
  describe("readListOfUrls", function(){
    it("should read the list of URLs", function(){
      return archive.readListOfUrls().should.eventually.deep.equal(['example1.com', 'example2.com']);
    });
  });
  describe("isUrlInList", function(){
    it('should find a URL in the list', function(){
      return archive.isUrlInList("example1.com").should.eventually.equal(1);
    });
    it('should not find a URL not in the list', function(){
      return archive.isUrlInList("example3.com").should.eventually.equal(null);
    });
  });
  describe("addUrlToList", function(){
    it("should append to the list", function(){
      return archive.readListOfUrls().then(function(urls){
        return archive.addUrlToList("example4.com").then(function(){
          return expect(archive.readListOfUrls()).to.eventually.have.length(urls.length + 1);
        });
      });
    });
    it("should not append to the list if the url is already there", function(){
      return archive.readListOfUrls().then(function(urls){
        return archive.addUrlToList("example1.com").then(function(){
          return expect(archive.readListOfUrls()).to.eventually.have.length(urls.length);
        });
      });
    });
    it("should return the line number of the url after appending", function(){
      return archive.addUrlToList("example5.com").should.eventually.equal(3);
    });
    it("should return the line number of the url when not appending", function(){
      return archive.addUrlToList("example1.com").should.eventually.equal(1);
    });
  });
  describe("isUrlArchived", function(){
    it('should find archived sites', function(){
      return archive.isUrlArchived("www.google.com").should.eventually.not.equal(null);
    });
    it('should not find sites that aren\'t archived', function(){
      return archive.isUrlArchived("en.wikipedia.org").should.eventually.equal(null);
    })
  });

  describe("downloadUrl", function(){
    it('should download a single url', function(){
      return archive.downloadUrl('http://wopsr.net').should.be.fulfilled;
    });
  });

  describe("downloadUrls", function(){
    it('should download sites', function(){
      return archive.downloadUrls(["http://wopsr.net", "http://va.riks.io/"]).should.be.fulfilled;
    });
  });
  xdescribe("getArchivedVersions", function(){

  });
});
