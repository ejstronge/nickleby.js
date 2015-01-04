////////////////////////////////////////////////////////////////////////
// Searching
////////////////////////////////////////////////////////////////////////
/** 
 * Encapsulates search information and functionality
 * @param {object} searchOptions - settings for the planned NCBI search
 */
var makeSearchObject = function(searchOptions) {

  var jquery = require('jquery'),
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

  var eutilBase = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      searchUrl = 'esearch.fcgi?',
      // Using a makeshift set; ignore the values for the databases keys
      databases = {'bioproject':1, 'biosample':1, 'biosystems':1, 'books':1, 'cdd':1,
                   'gap':1, 'dbvar':1, 'epigenomics':1, 'nucest':1, 'gene':1, 'genome':1,
                   'gds':1, 'geoprofiles':1, 'nucgss':1, 'homologene':1, 'mesh':1,
                   'toolkit':1, 'ncbisearch':1, 'nlmcatalog':1, 'nuccore':1, 'omia':1,
                   'popset':1, 'probe':1, 'protein':1, 'proteinclusters':1, 'pcassay':1,
                   'pccompound':1, 'pcsubstance':1, 'pubmed':1, 'pmc':1, 'snp':1, 'sra':1,
                   'structure':1, 'taxonomy':1, 'unigene':1, 'unists':1},
      defaultSearchParams = {
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
      allSearchParams = $.extend({}, defaultSearchParams, searchOptions);

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
      throw {
        name: 'TypeError',
        message: 'Received invalid attribute ' + attr + '.',
      };
    }
    if (arguments.length == 2) {
      allSearchParams[attr] = newVal; 
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
    if (!allSearchParams.term &&
        !(allSearchParams.db in databases)) {
      throw {
        name: 'TypeError',
        message: 'A valid DB and term are required',
      };
    }

    // TODO Terms should be allowed to be a group of [string, string] tuples
    // to handle the case where a user wants to restrict each of multiple
    // terms to specific fields
    if (allSearchParams.webenv !== '' || allSearchParams.query_key !== '') {
      // This is only set when needed
      allSearchParams.usehistory = 'y';
    }

    finalParams = {};
    $.each(allSearchParams, function(key, value) {
      if (!!value) finalParams[key] = value;
      return true;
    });
    return eutilBase + searchUrl + $.param(finalParams);
  };

  /*
   * Send a request to NCBI, using the parameters used to
   * construct this search object. A request is only sent
   * if an appropriate time has elapsed since the previous
   * request (see getSearchData.deadTime)
   */
  var getSearchData = function() {

    var searchData = {},

        // deadTime - minimal required interval, in milliseconds, 
        // between requests to the NCBI E-Utilities
        deadTime = 3333,

        // lastRequest - time of last request
        lastRequest = 0,

        doSubmission = function() {
          // Submit the query specified by the parameters, returning
          // a results object. 
          $.ajax({
            url: getQueryUrl(),
            type: "GET",
            dataType: "json",
            success: function(json){
              searchData = json;
            }
          });
        };

    // Do we need to pause to respect the NCBI rate limits?
    if (( lastRequest - (new Date()).getTime() ) < -deadTime) {
      lastRequest = (new Date()).getTime();
      doSubmission();
    } else {
      // TODO Make a unit test for this case
      setTimeout(function() {
        lastRequest = (new Date()).getTime();
        doSubmission();
      }, deadTime);
    }

    return {
      'searchData': searchData,
      'allSearchParams': allSearchParams
    };
  };

  return {
    'searchParam': searchParam,
    'getSearchData': getSearchData,

    // XXX debugging only
    '__getQueryUrl': getQueryUrl,
    '__logAllParams': function() {
      return allSearchParams;
    },
  };
};

module.exports = makeSearchObject;
