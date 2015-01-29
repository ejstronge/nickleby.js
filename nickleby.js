
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
      search = function(term_or_searchObject, delaySubmission) {
        var search_object;

        if (typeof term_or_searchObject === 'string') {
          // XXX Should do a global query here since the user hasn't
          // specified a specific database
          search_object = advancedSearch({'term': term_or_searchObject});
        } else if (typeof term_or_searchObject == 'object') {
          search_object = advancedSearch(term_or_searchObject);
        } else {
          throw new TypeError('search requires either a string or an object');
        }

        return search_object.getSearchResults();
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
