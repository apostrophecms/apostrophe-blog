function AposBlogPosts(optionsArg) {
  var self = this;
  var options = {
    instance: 'blogPost'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);
  // We can catch events and override methods here,
  // but the default behavior of the AposSnippets javascript is
  // just about right for now. Later we'll want to catch events to
  // add handlers for editing the publication date and status, etc.

  self.addingToManager = function($el, $snippet, snippet) {
    $snippet.find('[data-published]').text(snippet.publishedAt);
    if (snippet.tags !== null) {
      $snippet.find('[data-tags]').text(snippet.tags);
    }
  };
}

AposBlogPosts.addWidgetType = function(options) {
  if (!options) {
    options = {};
  }
  _.defaults(options, {
    name: 'blog',
    label: 'Blog Posts',
    action: '/apos-blog-post',
    defaultLimit: 5
  });
  AposSnippets.addWidgetType(options);
};



  // console.log()