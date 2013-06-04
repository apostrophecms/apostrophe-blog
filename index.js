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
    if (req.remainder.length) {
      var matches = req.remainder.match(/^\/\d+\/\d+\/\d+\/(.*)$/);
      if (matches) {
        req.remainder = '/' + matches[1];
      }
    }
    superDispatch.call(this, req, callback);
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

  self.permalink = function(snippet, page) {
    return page.slug + '/' + moment(snippet.publishedAt).format('YYYY/MM/DD') + '/' + snippet.slug;
  };

  // Establish the default sort order for blogs
  var superGet = self.get;

  self.get = function(req, optionsArg, callback) {
    var options = {};

    // "Why copy the object like this?" If we don't, we're modifying the
    // object that was passed to us, which could lead to side effects
    extend(options, optionsArg || {}, true);

    // If options.publishedAt is 'any', we're in the admin interface and should be
    // able to see articles whose publication date has not yet arrived. Otherwise,
    // show only published stuff
    if (options.publishedAt === 'any') {
      delete options.publishedAt;
    } else if (!options.publishedAt) {
      options.publishedAt = { $lte: new Date() };
    } else {
      // Custom criteria were passed for publishedAt
    }

    if (!options.sort) {
      options.sort = { publishedAt: -1 };
    }
    return superGet.call(self, req, options, callback);
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
  self.addApiCriteria = function(query, criteria) {
    superAddApiCriteria.call(self, query, criteria);
    criteria.publishedAt = 'any';
  };

  var superAddExtraAutocompleteCriteria = self.addExtraAutocompleteCriteria;
  self.addExtraAutocompleteCriteria = function(req, criteria) {
    superAddExtraAutocompleteCriteria.call(self, req, criteria);
    criteria.publishedAt = 'any';
  };

  self._apos.tasks['generate-blog-posts'] = function(callback) {
    var randomWords = require('random-words');
    var i;
    var posts = [];
    for (i = 0; (i < 100); i++) {
      var title = randomWords({ min: 5, max: 10, join: ' ' });
      var at = new Date();
      posts.push({
        type: 'blogPost',
        title: title,
        slug: self._apos.slugify(title),
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

