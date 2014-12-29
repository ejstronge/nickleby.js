////////////////////////////////////////////////////////////////////////
// Searching
////////////////////////////////////////////////////////////////////////
/** 
 * Encapsulates search information and functionality
 * @param {object} searchOptions - settings for the planned NCBI search
 */
var makeSearchObject = function(searchOptions) {
  var that = this,
      eutilBase = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      searchUrl = 'esearch.fcgi?',
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
    if (!allSearchParams.term || 
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
    return eutil_base + searchUrl + $.param(finalParams);
  };

  /*
   * Send a request to NCBI, using the parameters used to
   * construct this search object. A request is only sent
   * if an appropriate time has elapsed since the previous
   * request (see getSearchData.deadTime)
   */
  var getSearchData = function() {

    var that = this,
        // deadTime - period in milliseconds where you may not send a
        // second request to NCBI's E-Utilities. Please don't disable
        // rate-limiting
        deadTime = 3333,
        // lastRequest - time of last request
        lastRequest = (new Date()).getTime(),
        queryData = {},
        doSubmission = function() {
          // Submit the query specified by the parameters, returning
          // a results object. 
          $.ajax({
            url: getQueryUrl(),
            type: "GET",
            dataType: "json",
            success: function(json){
              that.queryData = json;
            }
          });
        };

    if (( (new Date()).getTime() - lastRequest) < deadTime) {
      // Pausing due to NCBI rate limits...
      setTimeout(function() {
        that.lastRequest = (new Date()).getTime();
        that.doSubmission();
      }, deadTime);
    } else {
      lastRequest = (new Date()).getTime();
      doSubmission();
    }

    return {
      'queryData': queryData,
      'allSearchParams': allSearchParams,
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
