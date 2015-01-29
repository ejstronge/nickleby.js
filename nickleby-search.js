////////////////////////////////////////////////////////////////////////
// Searching
////////////////////////////////////////////////////////////////////////
/** 
 * Encapsulates search information and functionality
 * @param {object} searchOptions - settings for the planned NCBI search
 */
var makeSearchObject = function(searchOptions) {

  var jquery = require('jquery'),
      Q = require('q'),
      $;

  // Give jQuery a special window if it's running in node.js
  if (typeof window === 'undefined') {
    $ = jquery(require('jsdom').jsdom().parentWindow);

    // In node.js, jQuery.ajax calls fail. Will replace the XHR method
    // with a built-in version (see http://stackoverflow.com/a/8916217)
    var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

    $.support.cors = true;
    $.ajaxSettings.xhr = function() {
        return new XMLHttpRequest();
    };
  } else {
    $ = jquery(window);
  }

  searchOptions = searchOptions || {};

  var eutilBase = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      searchUrl = 'esearch.fcgi?',
      // Using a makeshift set; ignore the values for the databases keys
      // XXX More databases will be supported over time!
      databases = {'pubmed':1},
      defaultSearchParams = {

        // See http://www.ncbi.nlm.nih.gov/books/NBK25499/ for details unless otherwise noted

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
        //  mindate and maxdate may be specfied as YYYY/MM/DD, YYYY, or YYYY/MM
        'datetype': '',
        'reldate': '',
        'mindate': '',
        'maxdate': '',
      },
      allSearchParams = $.extend(
          {},
          defaultSearchParams,
          // If we're passed an advanced search object, extract its parameters
          'getAllSearchParams' in searchOptions ? searchOptions.getAllSearchParams() : searchOptions),
      searchResults = {
        // True after query submission. Resets to false when any parameters change
        'submitted': false,
        'success': null,
        // If a search succeeds, searchResults.data will be contain the 
        // results. Otherwise, it will contain an error message, if 
        // one was available.
        //
        // Note the search data may indicate a failed search due to inappropriate
        // parameters. Such a situation is *not* handled in the library.
        'data': {}
      };

  /**
   * Get or set an attribute on this SearchObject.
   *
   * Only attributes which are present in defaultSearchParams
   * may be set with this function.
   *
   * @param {String} attr - Attribute to be returned or modified.
   * @param {String} [newVal] - When specified, the new value of attr.
   * @return {String|Number|Object} Returns either the value of attr if newVal isn't specified or `this`.
   *
   */
  var searchParam = function(attr, newVal) {
    if (!(attr in defaultSearchParams)) {
      console.log("quitting since " + attr + " is an invalid property");
      throw new TypeError('Received invalid attribute ' + attr + '.');
    }
    if (arguments.length == 2) {
      allSearchParams[attr] = newVal; 

      // Don't allow the user to set incorrect database values
      if (attr === 'db' && !(newVal in databases)) { 
        throw new TypeError('Unrecognized NCBI database: ' + newVal);
      }
      searchResults.submitted = false;
      return this;
    } else {
      return allSearchParams[attr];
    }
  };

  /**
   * Construct a URL from the parameters used to create
   * this search object
   */
  var getQueryUrl = function() {
    if (!allSearchParams.term || !allSearchParams.db) {
      throw new TypeError('Please specify both a search term and an NCBI database.');
    }
    // TODO Terms should be allowed to be a group of [string, string] tuples
    // to handle the case where a user wants to restrict each of multiple
    // terms to specific fields
    if (allSearchParams.webenv !== '' || allSearchParams.query_key !== '') {
      // This is only set when needed
      allSearchParams.usehistory = 'y';
    }
    finalParams = {};
    // Shorten the final url by leaving out false-y keys
    $.each(allSearchParams, function(key, value) {
      if (!!value) {
        finalParams[key] = value;
      }
      return true;
    });
    return eutilBase + searchUrl + $.param(finalParams);
  };

  var getSearchResults = function() {
    if (searchResults.submitted) {
      return searchResults;
    } else {
      // TODO With Q, it should be easy to add a delay to respect NCBI rate limits
      return Q($.ajax({
            url: getQueryUrl(),
            type: "GET",
            dataType: "json"
          }))
        .fin(function() {searchResults.submitted = true;})
        .then(function(data) {
          searchResults.success = true;
          searchResults.data = data;
          return searchResults;
        })
        .fail(function(e) {
          console.log(e);
          searchResults.success = false;
          searchResults.data = e.message;
          return searchResults;
        });
    }
  };

  return {
    // Get or set an attribute on this SearchObject. 
    //                                                            
    // Only attributes which are present in defaultSearchParams
    // may be set with this function.
    'searchParam': searchParam,

    // getSearchResults always returns a promise. Thus, callers won't be able to access
    // searchResults before results are ready.
    'getSearchResults': function() {
      if (!searchResults.submitted) {
        return getSearchResults();
      } else {
      return Q(searchResults);
      }
    },
    'getAllSearchParams': function() {
      return $.extend({}, allSearchParams);
    },

    // XXX For debugging only
    '__getQueryUrl': getQueryUrl
  };
};

module.exports = makeSearchObject;
