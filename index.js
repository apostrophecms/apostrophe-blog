var _ = require('lodash')
  , async = require('async')
  , moment = require('moment');

module.exports = {
  name: 'apostrophe-blog',
  alias: 'blog',
  label: 'Article',
  extend: 'apostrophe-pieces',

  moogBundle: {
    modules: ['apostrophe-blog-pages', 'apostrophe-blog-widgets'],
    directory: 'lib/modules'
  },

  beforeConstruct: function(self, options) {

    options.sort = { publishedAt: -1 };

    options.addFields = [
      {
        name: 'publishedAt',
        label: 'Publication Date',
        type: 'date',
        required: true
      },
    ].concat(options.addFields || []);

    options.arrangeFields = _.merge([
      { name: 'basic', label: 'Basics', fields: ['title', 'slug'] },
      { name: 'meta', label: 'Meta', fields: ['tags','published', 'publishedAt'] }
    ], options.arrangeFields || []);

    options.addColumns = [
      {
        name: 'publishedAt',
        label: 'Publication Date',
      }
    ].concat(options.addColumns || []);

    options.addSorts = [
      {
        name: 'publishedAt',
        label: 'By Publication Date',
        sort: { startDate: -1 }
      }
    ].concat(options.addSorts || []);

    options.addFilters = [
      {
        name: 'future',
        choices: [
          {
            value: true,
            label: 'Future'
          },
          {
            value: false,
            label: 'Past'
          },
          {
            value: null,
            label: 'Both'
          }
        ],
        def: null
      }
    ].concat(options.addFilters || []);
  },

  construct: function(self, options) {

    // limit the results of autocomplete for joins
    // so they only include past posts
    self.extendAutocompleteCursor = function(cursor) {
      return cursor.future(false);
    };

    // When editing we don't care if the blog post is in the future
    var superFindForEditing = self.findForEditing;
    self.findForEditing = function(req, criteria, projection) {
      return superFindForEditing(req, criteria, projection).future(null);
    };

    var superNewInstance = self.newInstance;
    self.newInstance = function() {
      var instance = superNewInstance();
      // Correct handling of dynamic default. If you do this in the schema
      // you wind up with the day the server launched
      if (!instance.publishedAt) {
        var now = moment();
        instance.publishedAt = now.format('YYYY-MM-DD');
      }
      return instance;
    };

  }
};
