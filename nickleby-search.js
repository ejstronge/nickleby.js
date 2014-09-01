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
