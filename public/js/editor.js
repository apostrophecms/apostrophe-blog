// JavaScript which enables editing of this module's content belongs here.

function AposBlog(optionsArg) {
  var self = this;
  var options = {
    instance: 'blogPost',
    name: 'blog'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);

  function findExtraFields($el, data, callback) {
    data.publicationDate = $el.find('[name="publication-date"]').val();
    data.publicationTime = $el.find('[name="publication-time"]').val();

    callback();
  }

  self.afterPopulatingEditor = function($el, snippet, callback) {
    $el.find('[name="publication-date"]').val(snippet.publicationDate);
    $el.find('[name="publication-time"]').val(apos.formatTime(snippet.publicationTime));

    apos.enhanceDate($el.findByName('publication-date'));

    callback();
  };

  self.addingToManager = function($el, $snippet, snippet) {
    if (snippet.published) {
      $snippet.find('[data-date]').text(snippet.publicationDate);
    }
    if (snippet.tags !== null) {
      $snippet.find('[data-tags]').text(snippet.tags);
    }
  };

  self.beforeInsert = function($el, data, callback) {
    findExtraFields($el, data, callback);
  };

  self.beforeUpdate = function($el, data, callback) {
    findExtraFields($el, data, callback);
  };
}

AposBlog.addWidgetType = function(options) {
  if (!options) {
    options = {};
  }
  _.defaults(options, {
    name: 'blog',
    label: 'Blog Posts',
    action: '/apos-blog',
    defaultLimit: 5
  });
  AposSnippets.addWidgetType(options);
};

