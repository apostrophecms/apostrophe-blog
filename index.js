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
    var now = moment();

    options.sort = { publishedAt: -1 };

    options.addFields = [
      {
        name: 'publishedAt',
        label: 'Publication Date',
        type: 'date',
        def: now.format('YYYY-MM-DD'),
        required: true
      },
    ].concat(options.addFields || []);

    options.arrangeFields = _.merge([
      { name: 'basic', label: 'Basics', fields: ['title', 'slug'] },
      { name: 'meta', label: 'Meta', fields: ['tags','published'] }
    ], options.arrangeFields || []);

    options.addColumns = [
      {
        name: 'publishedAt',
        label: 'Publication Date', 
      }
    ]

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

    self.apos.define('apostrophe-blog-cursor', require('./lib/cursor.js'));

    // limit the results of autocomplete for joins
    // so they only include past posts
    self.extendAutocompleteCursor = function(cursor) {
      return cursor.future(false);
    };
  }
};
