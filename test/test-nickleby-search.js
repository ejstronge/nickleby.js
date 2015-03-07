
// test-nickleby-search.js

// Part of nickleby.js
// (c) 2015 Edward J. Stronge <ejstronge@gmail.com>
// nickleby.js is distributed under the GPLv3 - see LICENSE

var assert = require('assert'),
    nickleby = require('../nickleby'),
    Q = require('q');

describe('nickleby.makeSearchObject', function() {

  var parameterSet = [
        ['db', 'pubmed'],
        ['term', 'neural crest'],
        ['webenv', '123456'],
        ['query_key', 'ABCDEFG'],
        ['retstart', '1000'],
        ['retmax', '20'],
        ['rettype', 'uilist'],
        ['retmode', 'json'],
        ['sort', 'Last Author'],
        ['field', 'Affiliation'],
        ['datetype', 'pdat'],
        ['reldate', '500'],
        ['mindate', '2009/11/11'],
        ['maxdate', '50'],
      ],
      populateCandidateSearchObject = function(initialSearchObject) {

        if (initialSearchObject === undefined) {
          initialSearchObject = nickleby.advancedSearch();
        }
        parameterSet.reduce(
            function(modifiedSearchObject, params) {
              return modifiedSearchObject.searchParam.apply(modifiedSearchObject, params);
            },
            initialSearchObject);
        return initialSearchObject;
      };

  describe('instantiation', function() {

    it('should accept parameters from a previously-run advancedSearch', function() {
      var newObject,
          searchObject = populateCandidateSearchObject();

      newObject = nickleby.advancedSearch(searchObject);

      assert.doesNotThrow(
        function() {nickleby.advancedSearch(searchObject);},
        /TypeError/,
        "Could not initiate a search using a previously-created searchObject"
      );
      for (var paramIndex = 0; paramIndex < parameterSet.length; paramIndex++) {
        paramName = parameterSet[paramIndex][0];
        paramValue = parameterSet[paramIndex][1];
        assert.strictEqual(paramValue, newObject.searchParam(paramName));
      }
    });

  });

  describe('#searchParam()', function() {

    it('should return previously set parameters', function() {
      var searchObject = populateCandidateSearchObject(),
          paramName,
          paramValue;
      for (var paramIndex = 0; paramIndex < parameterSet.length; paramIndex++) {
        paramName = parameterSet[paramIndex][0];
        paramValue = parameterSet[paramIndex][1];
        assert.strictEqual(paramValue, searchObject.searchParam(paramName));
      }
    });

    it('should set new parameters and return a searchObject', function() {
      var referenceSearchObject = nickleby.advancedSearch(),
          candidateSearchObject = populateCandidateSearchObject();
      // This function checks for the presence of the searchObject public API in candidate
      // searchObjects.
      //
      // This is an ugly approach but the alternative would be to make searchObjects inherit
      // from a prototype, which isn't otherwise necessary.
      for (var attr in referenceSearchObject) {
        if (referenceSearchObject.hasOwnProperty(attr)) {
          assert(
            candidateSearchObject.hasOwnProperty(attr),
            "Returned search object does not have property " + attr);
        }
      }
    });

    it('should reject invalid parameter names', function() {
      var searchObject = nickleby.advancedSearch();

      assert.throws(
        function() {searchObject.searchParam('Douglas Adams', '42');},
        /TypeError/,
        "searchObject.searchParam accepted an invalid parameter, Douglas Adams.");
    });

    it('should reject currently unsupported NCBI databases', function() {
      var searchObject = nickleby.advancedSearch();

      assert.throws(
        function() {searchObject.searchParam('db', 'pubmedx');},
        /TypeError/,
        "searchObject.searchParam accepted an unsupported database."
      );
    });
  });

  describe('#getQueryUrl', function() {

    it('should require both term and database values', function() {
      var searchObject,
          testParameters = [['db', 'pubmed', 'missing search term'], ['term', 'NCC', 'missing target database']];

      for (var i = 0; i < testParameters.length; i++) {
        searchObject = nickleby.advancedSearch();
        searchObject.searchParam.apply(searchObject, testParameters[i]);
        assert.throws(
          searchObject.__getQueryUrl,
          /TypeError/, 
          'searchObject.getQueryUrl did not detect a ' + testParameters[i][2]
          );
      }
    });

    it('should set the usehistory flag as appropriate', function() {
      var searchObjectWithHistory = nickleby.advancedSearch()
        .searchParam('db', 'pubmed')
        .searchParam('term', 'NCC')
        .searchParam('webenv', '123456')
        .searchParam('query_key', 'ABCDEFG');

      searchObjectWithHistory.__getQueryUrl();

      assert.strictEqual('y', searchObjectWithHistory.getAllSearchParams().usehistory);
    });


    it("should encode url parameters according to the searchObject's parameters");
    // 'unparse' url parameters and check that they're the same as the non-false-y
    // searchObject parameters
    //
    // Will hold off on this - it could be a lot of work, though it's definitely an
    // important thing to test.
  
  });

  describe('#getSearchResults', function() {

    it('should log its progress', function() {
      var searchObject = nickleby.advancedSearch()
        .searchParam('db', 'pubmed')
        .searchParam('term', 'NCC')
        .getSearchResults();

    });
    it('should limit the rate of outgoing requests');
    // I would like to implement this but can't think of a way that
    // wouldn't be easy to circumvent. It might be easiest to remind
    // users of NCBI's limits.

  });
});
