
module.exports = (function() {
  //     nickleby.js
  //     (c) 2014 Edward J. Stronge <ejstronge@gmail.com>
  //     nickleby.js is distributed under the GPLv3 - see LICENSE

  var jquery = require('jquery'),
      // Load jsdom if this script is running in Node
      $ = jquery(
        typeof window === undefined ? window : require('jsdom').jsdom().parentWindow),
      toolname = 'nickleby.js',
      author_email = 'nickleby.js@gmail.com',
      last_request = 0,
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
})();
