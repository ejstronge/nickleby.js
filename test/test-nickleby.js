
// test-nickleby.js

// Part of nickleby.js
// (c) 2015 Edward J. Stronge <ejstronge@gmail.com>
// nickleby.js is distributed under the GPLv3 - see LICENSE

var assert = require('assert'),
    nickleby = require('../nickleby'),
    Q = require('q');

describe('nickleby', function() {
  describe('#search', function() {
    it('should require both a search term and an NCBI database', function() {
      assert.throws(
        function() {nickleby.search();},
        /TypeError/,
        "Allowed a search to begin without a search term and NCBI database name");

      assert.throws(
        function() {nickleby.search('NCC');},
        /TypeError/,
        "Allowed a search to begin with only a search term and no NCBI database name");

      assert.throws(
        function() {nickleby.search(null, 'pubmed');},
        /TypeError/,
        "Allowed a search to begin with no search term and only an NCBI database name");
    });

    // Note that the object used below differs from those produced by nickleby.advancedSearch
    it('should accept a settings object as a first parameter', function() {
      assert.doesNotThrow(
        function() {
          nickleby.search(
            {'term': 'NCC',
             'db': 'pubmed'});
        },
        /TypeError/,
        "Could not initiate a search using an object defining 'term' and 'ncbiDatabase'"
      );
    });

    it('should accept a settings object as a first parameter', function() {

      var searchObject = nickleby.advancedSearch()
        .searchParam('term', 'NCC')
        .searchParam('db', 'pubmed');

      assert.doesNotThrow(
        function() {nickleby.search(searchObject);},
        /TypeError/,
        "Could not initiate a search using a previously-created searchObject"
      );
    });
  });
});
