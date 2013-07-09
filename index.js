var async = require('async');
var _ = require('underscore');
var extend = require('extend');
var snippets = require('apostrophe-snippets');
var util = require('util');
var moment = require('moment');

// Creating an instance of the blog module is easy:
// var blog = require('apostrophe-blog')(options, callback);
//
// If you want to access the constructor function for use in the
// constructor of a module that extends this one, consider:
//
// var blog = require('apostrophe-blog');
// ... Inside the constructor for the new object ...
// blog.Blog.call(this, options, null);
//
// In fact, this module does exactly that to extend the snippets module
// (see below). Something similar happens on the browser side in
// main.js.

module.exports = blog;

function blog(options, callback) {
  return new blog.Blog(options, callback);
}

blog.Blog = function(options, callback) {
  var self = this;
  _.defaults(options, {
    instance: 'blogPost',
    name: options.name || 'blog',
    label: options.name || 'Blog',
    icon: options.icon || 'blog',
    // The default would be aposBlogPostMenu, this is more natural
    menuName: 'aposBlogMenu'
  });

  options.modules = (options.modules || []).concat([ { dir: __dirname, name: 'blog' } ]);

  // Call the base class constructor. Don't pass the callback, we want to invoke it
  // ourselves after constructing more stuff
  snippets.Snippets.call(this, options, null);

  // The snippet dispatcher is almost perfect for our needs, except that
  // we expect the publication date of the blog post to appear before the slug
  // of the blog post in the URL. So spot that situation, change req.remainder
  // to just the slug of the blog post, and invoke the original version of
  // "dispatch."

  // Grab the "superclass" version of the dispatch method so we can call it
  var superDispatch = self.dispatch;

  self.dispatch = function(req, callback) {
    var matches;
    if (req.remainder.length) {
      // An article: /YYYY/MM/DD/slug-of-article
      matches = req.remainder.match(/^\/\d+\/\d+\/\d+\/(.+)$/);
      if (matches) {
        // Let the default dispatcher find the article. We don't really care
        // if the date is correct
        req.remainder = '/' + matches[1];
      } else {
        // Spot a year and month in the URL to implement filtering by month
        matches = req.remainder.match(/^\/(\d+)\/(\d+)$/);

        // activeYear and activeMonth = we are filtering to that month.
        // thisYear and thisMonth = now (as in today).

        // TODO: consider whether blog and events should share more logic
        // around this and if so whether to use a mixin module or shove it
        // into the (dangerously big already) base class, the snippets module
        // or possibly even have events subclass blog after all.

        if (matches) {
          // force to integer
          req.extras.activeYear = matches[1];
          req.extras.activeMonth = matches[2];
          // set up the next and previous urls for our calendar
          var nextYear = req.extras.activeYear;
          // Note use of - 0 to force a number
          var nextMonth = req.extras.activeMonth - 0 + 1;
          if (nextMonth > 12) {
            nextMonth = 1;
            nextYear = req.extras.activeYear - 0 + 1;
          }
          nextMonth = pad(nextMonth, 2);
          req.extras.nextYear = nextYear;
          req.extras.nextMonth = nextMonth;

          var prevYear = req.extras.activeYear;
          var prevMonth = req.extras.activeMonth - 0 - 1;
          if (prevMonth < 1) {
            prevMonth = 12;
            prevYear = req.extras.activeYear - 0 - 1;
          }
          prevMonth = pad(prevMonth, 2);
          req.extras.prevYear = prevYear;
          req.extras.prevMonth = prevMonth;
          // Make sure the default dispatcher considers the job done
          req.remainder = '';
        }
      }
    } else {
      // Nothing extra in the URL
      req.extras.defaultView = true;
      // The current month and year, for switching to navigating by month
      var now = moment(new Date());
      req.extras.thisYear = now.format('YYYY');
      req.extras.thisMonth = now.format('MM');
    }

    return superDispatch.call(this, req, callback);

    function pad(s, n) {
      return self._apos.padInteger(s, n);
    }
  };

  self.getDefaultTitle = function() {
    return 'My Article';
  };

  // TODO this is not very i18n friendly
  self.getAutocompleteTitle = function(snippet) {
    return snippet.title + ' (' + moment(snippet.publishedAt).format('MM/DD') + ')';
  };

  // I bet you want some extra fields available along with the title to go with
  // your custom getAutocompleteTitle. Override this to retrieve more stuff.
  // We keep it to a minimum for performance.
  self.getAutocompleteFields = function() {
    return { title: 1, _id: 1, publishedAt: 1 };
  };

  // Returns a "permalink" URL to the snippet, beginning with the
  // slug of the specified page. See findBestPage for a good way to
  // choose a page beneath which to link this snippet.
  //
  // It is commonplace to override this function. For instance,
  // blog posts add the publication date to the URL.

  self.permalink = function(req, snippet, page, callback) {
    snippet.url = page.slug + '/' + moment(snippet.publishedAt).format('YYYY/MM/DD') + '/' + snippet.slug;
    return callback(null);
  };

  // Establish the default sort order for blogs
  var superGet = self.get;

  self.get = function(req, userCriteria, optionsArg, callback) {
    var options = {};
    var filterCriteria = {};

    // "Why copy the object like this?" If we don't, we're modifying the
    // object that was passed to us, which could lead to side effects
    extend(options, optionsArg || {}, true);

    // If options.publishedAt is 'any', we're in the admin interface and should be
    // able to see articles whose publication date has not yet arrived. Otherwise,
    // show only published stuff
    if (options.publishedAt === 'any') {
      // Do not add our usual criteria for publication date. Note
      // that userCriteria may still examine publication date
    } else {
      filterCriteria.publishedAt = { $lte: new Date() };
    }

    if (!options.sort) {
      options.sort = { publishedAt: -1 };
    }

    // Use $and to build a query that preserves whatever the
    // userCriteria may be trying to do while still enforcing
    // our publication date criteria

    return superGet.call(self, req, { $and: [ userCriteria, filterCriteria ] }, options, callback);
  };

  function appendExtraFields(data, snippet, callback) {
    snippet.publicationDate = self._apos.sanitizeDate(data.publicationDate, snippet.publicationDate);
    snippet.publicationTime = self._apos.sanitizeTime(data.publicationTime, snippet.publicationTime);
    if (snippet.publicationTime === null) {
      snippet.publishedAt = new Date(snippet.publicationDate);
    } else {
      snippet.publishedAt = new Date(snippet.publicationDate + ' ' + snippet.publicationTime);
    }
    return callback(null);
  }

  self.beforeInsert = function(req, data, snippet, callback) {
    appendExtraFields(data, snippet, callback);
  };

  self.beforeUpdate = function(req, data, snippet, callback) {
    appendExtraFields(data, snippet, callback);
  };

  var superAddApiCriteria = self.addApiCriteria;
  self.addApiCriteria = function(query, criteria, options) {
    superAddApiCriteria.call(self, query, criteria, options);
    options.publishedAt = 'any';
  };

  var superAddCriteria = self.addCriteria;

  self.addCriteria = function(req, criteria, options) {
    superAddCriteria.call(self, req, criteria, options);

    // activeYear and activeMonth = we are filtering to that month.
    // thisYear and thisMonth = now (as in today).

    // TODO: consider whether blog and events should share more logic
    // around this and if so whether to use a mixin module or shove it
    // into the (dangerously big already) base class, the snippets module
    // or possibly even have events subclass blog after all.

    if (req.extras.activeYear) {
      // force to integer
      var year = req.extras.activeYear - 0;
      // month is 0-11 because javascript is wacky because Unix is wacky
      var month = req.extras.activeMonth - 1;
      // this still works if the month is already 11, you can roll over
      criteria.publishedAt = { $gte: new Date(year, month, 1), $lt: new Date(year, month + 1, 1) };
      // When showing content by month we switch to ascending dates
      options.sort = { publishedAt: 1 };
    }
  };

  var superAddExtraAutocompleteCriteria = self.addExtraAutocompleteCriteria;
  self.addExtraAutocompleteCriteria = function(req, criteria, options) {
    superAddExtraAutocompleteCriteria.call(self, req, criteria, options);
    options.publishedAt = 'any';
  };

  self._apos.tasks['generate-blog-posts'] = function(callback) {
    var randomWords = require('random-words');
    var i;
    var posts = [];
    for (i = 0; (i < 100); i++) {
      var title = randomWords({ min: 5, max: 10, join: ' ' });
      var at = new Date();
      // Many past publication times and a few in the future
      // 86400 = one day in seconds, 1000 = milliseconds to seconds
      at.setTime(at.getTime() + (10 - 90 * Math.random()) * 86400 * 1000);
      posts.push({
        type: 'blogPost',
        title: title,
        slug: self._apos.slugify(title),
        testData: true,
        areas: {
          body: {
            items: [
              {
                type: 'richText',
                content: randomWords({ min: 50, max: 200, join: ' ' })
              }
            ]
          }
        },
        publishedAt: at,
        publicationDate: moment(at).format('YYYY-MM-DD'),
        publicationTime: moment(at).format('HH:MM'),
        published: true
      });
    }
    self._apos.pages.insert(posts, callback);
  };

  if (callback) {
    // Invoke callback on next tick so that the blog object
    // is returned first and can be assigned to a variable for
    // use in whatever our callback is invoking
    process.nextTick(function() { return callback(null); });
  }
};

