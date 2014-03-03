// JavaScript which enables editing of this module's content belongs here.

function AposBlog(optionsArg) {
  var self = this;
  var options = {
    instance: 'blogPost',
    name: 'blog'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);

  self.addingToManager = function($el, $snippet, snippet) {
    if (snippet.published) {
      $snippet.find('[data-date]').text(snippet.publicationDate);
    }
  };
}

