module.exports = {
  label: 'Blog Widget',
  extend: 'apostrophe-pieces-widgets',

  construct: function(self, options) {
    // Append upcoming flag by extending widgetCursor.
    var superWidgetCursor = self.widgetCursor;
    self.widgetCursor = function(req, criteria) {
      return superWidgetCursor(req, criteria).future(false);
    };
  }
};
