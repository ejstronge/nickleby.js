
module.exports = (function() {
  //     nickleby.js
  //     (c) 2014 Edward J. Stronge <ejstronge@gmail.com>
  //     nickleby.js is distributed under the GPLv3 - see LICENSE

  var jquery = require('jquery'),
      // Load jsdom if this script is running in Node
      $ = jquery(
        typeof window === 'undefined' ? require('jsdom').jsdom().parentWindow : window),
      toolname = 'nickleby.js',
      author_email = 'nickleby.js@gmail.com',
      last_request = 0;

  ////////////////////////////////////////////////////////////////////////
  // Searching
  ////////////////////////////////////////////////////////////////////////

  var advancedSearch = require('./nickleby-search.js'),
      search = function(term_or_searchObject, ncbiDatabase) {
        var searchObject;

        if ((typeof term_or_searchObject === 'string') && (ncbiDatabase !== null)) {
          searchObject = advancedSearch(
              {'term': term_or_searchObject,
               'database': ncbiDatabase
              }
          );
        } else if (typeof term_or_searchObject === 'object') {
          searchObject = advancedSearch(term_or_searchObject);
        } else {
          throw new TypeError('Please supply a search term and target NCBI database.');
        }

        return searchObject.getSearchResults();
      };

  ////////////////////////////////////////////////////////////////////////
  // Exports
  ////////////////////////////////////////////////////////////////////////
  ncbi = {
    'search': search,
    'advancedSearch': advancedSearch,
  };

  return ncbi;
})();
