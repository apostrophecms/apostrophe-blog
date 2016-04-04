var moment = require('moment');

module.exports = function(self, cursor) {
  // If set to true, the future flag allows us to get posts
  // with a publication date in the future. By default, 
  // this is false by default
  cursor.addFilter('future', {
    def: false,
    finalize: function() {
      var future = cursor.get('future');
      if (future === null) {
        return;
      }

      var now = moment().format('YYYY-MM-DD');

      if(future) {
        cursor.and({
          publicationDate: { $gte: now }
        });
      } else {
        cursor.and({
          publicationDate: { $gte: now }
        });
      }
    },
    launder: function(s) {
      return self.apos.launder.booleanOrNull(s);
    }    
  });
};