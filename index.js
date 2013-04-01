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
    // Overridden separately so that one can have types that just
    // override the templates and don't mess with replacing
    // all of the javascript and CSS
    webAssetDir: __dirname,
    // The default would be aposBlogPostMenu, this is more natural
    menuName: 'aposBlogMenu'
  });

  // Find our templates before the snippet templates (a chain of overrides)
  options.dirs = (options.dirs || []).concat([ __dirname ]);

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

  // Returns a "permalink" URL to the snippet, beginning with the
  // slug of the specified page. See findBestPage for a good way to
  // choose a page beneath which to link this snippet.
  //
  // It is commonplace to override this function. For instance,
  // blog posts add the publication date to the URL.

  self.permalink = function(snippet, page) {
    return page.slug + '/' + moment(snippet.publishedAt).format('YYYY/MM/DD') + '/' + snippet.slug;
  };

  if (callback) {
    // Invoke callback on next tick so that the blog object
    // is returned first and can be assigned to a variable for
    // use in whatever our callback is invoking
    process.nextTick(function() { return callback(null); });
  }
};

