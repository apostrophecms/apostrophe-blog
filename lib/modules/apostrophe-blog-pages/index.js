module.exports = {
  name: 'apostrophe-blog-page',
  label: 'Blog Page',
  extend: 'apostrophe-pieces-pages',

  construct: function(self, options) {
    // Make sure future filter is set to false
    var superIndexCursor = self.indexCursor;
    self.indexCursor = function(req) {
      return superIndexCursor(req).future(false);
    };
  }
};