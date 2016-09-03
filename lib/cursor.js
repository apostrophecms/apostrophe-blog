var moment = require('moment');

module.exports = {
  construct: function(self, options) {
    // If set to true, the future flag allows us to get posts
    // with a publication date in the future. By default,
    // this is false by default
    self.addFilter('future', {
      def: false,
      finalize: function() {
        var future = self.get('future');
        if (future === null) {
          return;
        }

        var now = moment().format('YYYY-MM-DD');

        if (future) {
          self.and({
            publishedAt: { $gte: now }
          });
        } else {
          self.and({
            publishedAt: { $lte: now }
          });
        }
      },
      safeFor: 'public',
      launder: function(s) {
        return self.apos.launder.booleanOrNull(s);
      }
    });
  }
};
