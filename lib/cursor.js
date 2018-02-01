var _ = require('lodash');
var moment = require('moment');

module.exports = {
  construct: function(self, options) {
    // If set to true, the future flag allows us to get posts
    // with a publication date in the future. By default,
    // this is false by default
    self.addFilter('future', {
      def: false,
      finalize: function() {
        var future = self.get('future') ? self.get('future') : false;
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

    self.addFilter('year', {
      def: null,
      safeFor: 'public',
      finalize: function() {
        var year = self.get('year');

        if (year === null) {
          return;
        }

        self.and({
          publishedAt: { $regex: '^'+ year }
        });
      },
      launder: function(s) {
        s = self.apos.launder.string(s);

        if (!s.match(/^\d\d\d\d$/)) {
          return '';
        }

        return s;
      },
      choices: function(callback) {
        return self.toDistinct('publishedAt', function(err, results) {
          if (err) {
            return callback(err);
          }

          return callback(null, _.uniq(_.each(results, function(value, key) { results[key] = value.substr(0,4) })).sort());
        });
      }
    });

    self.addFilter('month', {
      def: null,
      safeFor: 'public',
      finalize: function() {
        var month = self.get('month');

        if (month === null) {
          return;
        }

        self.and({
          publishedAt: { $regex: '^'+ month }
        });
      },
      launder: function(s) {
        s = self.apos.launder.string(s);

        if (!s.match(/^\d\d\d\d\-\d\d$/)) {
          return '';
        }

        return s;
      },
      choices: function(callback) {
        return self.toDistinct('publishedAt', function(err, results) {
          if (err) {
            return callback(err);
          }

          return callback(null, _.uniq(_.each(results, function(value, key) { results[key] = value.substr(0,7) })).sort());
        });
      }
    });

    self.addFilter('day', {
      def: null,
      safeFor: 'public',
      finalize: function() {
        var day = self.get('day');

        if (day === null) {
          return;
        }

        self.and({
          publishedAt: day
        });
      },
      launder: function(s) {
        return self.apos.launder.string(s);
      },
      choices: function(callback) {
        return self.toDistinct('publishedAt', function(err, results) {
          if (err) {
            return callback(err);
          }

          return callback(null, results);
        });
      }
    });
  }
};
