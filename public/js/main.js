function AposBlog(optionsArg) {
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
}
