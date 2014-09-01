(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     nickleby.js
//     (c) 2014 Edward J. Stronge <ejstronge@gmail.com>
//     nickleby.js is distributed under the GPLv3 - see LICENSE

(function ($) {

    var toolname = 'nickleby.js',
        author_email = 'nickleby.js@gmail.com',
        last_request = 0,
        eutil_base = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
        // Using a makeshift set; ignore the values for the databases keys
        databases = {'bioproject':1, 'biosample':1, 'biosystems':1, 'books':1, 'cdd':1,
                     'gap':1, 'dbvar':1, 'epigenomics':1, 'nucest':1, 'gene':1, 'genome':1,
                     'gds':1, 'geoprofiles':1, 'nucgss':1, 'homologene':1, 'mesh':1,
                     'toolkit':1, 'ncbisearch':1, 'nlmcatalog':1, 'nuccore':1, 'omia':1,
                     'popset':1, 'probe':1, 'protein':1, 'proteinclusters':1, 'pcassay':1,
                     'pccompound':1, 'pcsubstance':1, 'pubmed':1, 'pmc':1, 'snp':1, 'sra':1,
                     'structure':1, 'taxonomy':1, 'unigene':1, 'unists':1};

    ////////////////////////////////////////////////////////////////////////
    // Searching
    ////////////////////////////////////////////////////////////////////////
    var makeSearchObject = require('./nickleby-search.js');

    ////////////////////////////////////////////////////////////////////////
    // Viewing and Manipulating Results
    ////////////////////////////////////////////////////////////////////////

    var makeResultsObject = function(search_results) {
      // TODO in testing, check that header.type === 'esearch' and
      // header.version === '0.3'
      // 
      // XXX Will need to consider parsing the rettype, etc. to make
      // handling the resulting object consistent. 
      var result_count = search_results.query_response.esearchresult.count,
          last_downloaded_result = search_results.query_response.esearchresult,
          cached_search_object = makeSearchObject(search_results.search_params),
          new_retstart,
          new_retmax,
          more_results;

      search_results.search_params = null;

      var getNextResultSet = function(retmax) { // Return retmax results
        return undefined;
      };
    };
    // XXX Results should be chainable; switches to different DB's should
    // be handled transparently through the ELink service
    //
    // .dblink('new_db') should give related uid's


    ////////////////////////////////////////////////////////////////////////
    // nickleby.js Public API
    ////////////////////////////////////////////////////////////////////////

    var search = function(term_or_searchObject, delaySubmission) {
      var search_object;

      if (typeof term_or_searchObject === 'string') {
        // XXX Should do a global query here since the user hasn't
        // specified a specific database
        search_object = makeSearchObject({'term': term_or_searchObject});
      } else if (typeof term_or_searchObject == 'object') {
        search_object = makeSearchObject(term_or_searchObject);
      } else {
        throw {
          name: 'TypeError',
          message: 'search requires either a string or an object'
        };
      }

      if (delaySubmission) {
        // The caller must call the submit() method on the
        // search_object. Use this option when customization of a
        // search object beyond its defaults is required.
        return search_object;
      } else {
        return makeResultsObject(search_object.getSearchData());
      }
    };


    ////////////////////////////////////////////////////////////////////////
    // Utilities
    ////////////////////////////////////////////////////////////////////////

    // Use epost to upload a long list of unique identifiers to NCBI.
    // The list of identifiers can be referenced by the returned
    // query_key and web_env variables.
    //
    // Used internally for cross-database searches
    var epost = function(db, uids) {
      return {'query_key': null,
              'web_env': null,
              };
    };

    var elink = function(db1, db2) {
      return undefined;
    };

    ////////////////////////////////////////////////////////////////////////
    // Exports
    ////////////////////////////////////////////////////////////////////////
    ncbi = {
      'search': search,
      'makeSearchObject': makeSearchObject,
    };
    return ncbi;
  }(jQuery));

},{"./nickleby-search.js":2}],2:[function(require,module,exports){
////////////////////////////////////////////////////////////////////////
// Searching
////////////////////////////////////////////////////////////////////////
var makeSearchObject = function(search_options) {
  var that = this,
      //
      // dead_time - period in milliseconds where you may not send a
      // second request to NCBI's E-Utilities. Please don't disable
      // rate-limiting
      dead_time = 3333,
      search_url = 'esearch.fcgi?',
      default_search_params = {
        //
        // Search parameters
        'db': null, // Database to search
        'term': null, // Search query
        //
        // History server
        'webenv': '',
        'query_key': '',
        //
        // TODO The default retrieval and date values differ for each
        // database; need to separate the different possibilities
        // and eventually check for inappropriate values
        //
        // Retrieval parameters
        'retstart': null, // First index to retrieve
        'retmax': null, // 100k max return value; use history server if >100k
        'rettype': null, // Either 'uilist' (unique ID list) or 'count'.
        'retmode': 'json', // Will use JSON here; XML also possible
        //
        //  - sort: Attribute for sorting. Varies by database.
        //
        //        pubmed sort options:
        //        Recently Added, Publication Date, First Author, 
        //        Last Author, Journal, Title and Relevance. 
        'sort': null,
        // 
        //  - field: database field to query with search term; varies by database
        //
        //    pubmed fields: 
        //      http://www.ncbi.nlm.nih.gov/books/NBK3827/#pubmedhelp.Search_Field_Descrip
        'field': null,
        //
        // Date parameters
        'datetype': '',
        'reldate': '',
        'mindate': '',
        'maxdate': '',
      },
      search_params = $.extend({}, default_search_params, search_options);

  var searchParam = function(attr, new_val) {
    // Get or set an attribute on this SearchObject. 
    //
    // Only attributes which are present in default_search_params
    // may be set with this function.
    if (!(attr in default_search_params)) {
      console.log("quitting since " + attr + " is an invalid property");
      throw {
        name: 'TypeError',
        message: 'Received invalid attribute ' + attr + '.',
      };
    }
    if (arguments.length == 2) {
      search_params[attr] = new_val; 
      return this;
    } else {
      return search_params[attr];
    }
  };

  var getQueryUrl = function() {
    if (!search_params.term || 
        !(search_params.db in databases)) {
      throw {
        name: 'TypeError',
        message: 'A valid DB and term are required',
      };
    }

    // TODO Terms should be allowed to be a group of [string, string] tuples
    // to handle the case where a user wants to restrict each of multiple
    // terms to specific fields
    if (search_params.webenv !== '' || search_params.query_key !== '') {
      // This is only set when needed
      search_params.usehistory = 'y';
    }

    final_params = {};
    $.each(search_params, function(key, value) {
      if (!!value) final_params[key] = value;
      return true;
    });
    return eutil_base + search_url + $.param(final_params);
  };

  var getSearchData = function() {
    // If an appropriate time has elapsed since the last request,
    // make a new ajax call.

    var query_data = {};
    var doSubmission = function() {
      // Submit the query specified by the parameters, returning
      // a results object. 
      $.ajax({
        url: getQueryUrl(),
        type: "GET",
        dataType: "json",
        success: function(json){
          query_data = json;
        }
      });
    };

    if (( (new Date()).getTime() - last_request ) < dead_time) {
      // Pausing due to NCBI rate limits...
      setTimeout(function() {
        last_request = (new Date()).getTime();
        doSubmission();
      }, dead_time);
    } else {
      last_request = (new Date()).getTime();
      doSubmission();
    }
    return {
      'query_response': query_data,
      'search_params': search_params,
    };
  };
  return {
    'searchParam': searchParam,
    'getSearchData': getSearchData,
    // XXX debugging only
    '__getQueryUrl': getQueryUrl,
    '__logAllParams': function() {
      return search_params;
    },
  };
};

module.exports = makeSearchObject;

},{}]},{},[1]);
