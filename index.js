var async = require('async');
var _ = require('underscore');
var extend = require('extend');

module.exports = function(options, callback) {
  return new Blog(options, callback);
};

function Blog(options, callback) {
  var apos = options.apos;
  var pages = options.pages;
  var app = options.app;
  var aposBlog = self = this;

  // For visibility in other scopes
  aposBlog.options = options;

  // Make sure that aposScripts and aposStylesheets summon our
  // browser-side UI assets for managing pages

  apos.scripts.push('/apos-blog/js/blog.js');

  apos.stylesheets.push('/apos-blog/css/blog.css');

  apos.templates.push(__dirname + '/views/newPost');
  apos.templates.push(__dirname + '/views/editPost');
  apos.templates.push(__dirname + '/views/editPosts');
  apos.templates.push(__dirname + '/views/pageSettings');

  pages.addGroup('blog', {
    settings: {
      sanitize: function(data, callback) {
        var ok = {};
        ok.tags = apos.sanitizeTags(data.tags);
        return callback(null, ok);
      }
    }
  });

  app.post('/apos-blog/new', function(req, res) {
    var post;
    var title;
    var content;
    var slug;
    var tags;

    title = req.body.title.trim();
    // Validation is annoying, automatic cleanup is awesome
    if (!title.length) {
      title = 'New Post';
    }
    slug = apos.slugify(title);

    content = JSON.parse(req.body.content);
    apos.sanitizeItems(content);

    tags = req.body.tags;

    async.series([ permissions, insertPost ], sendPost);

    function permissions(callback) {
      return apos.permissions(req, 'edit-post', null, function(err) {
        // If there is no permissions error then we are cool
        // enough to create a post
        return callback(err);
      });
    }

    function insertPost(callback) {
      post = { title: title, type: 'blogPost', tags: tags, areas: { body: { items: content } }, slug: slug, createdAt: new Date(), publishedAt: new Date() };
      apos.putPage(slug, post, callback);
    }

    function sendPost(err) {
      if (err) {
        res.statusCode = 500;
        return res.send('error');
      }
      return res.send(JSON.stringify(post));
    }
  });

  app.post('/apos-blog/edit', function(req, res) {
    var post;
    var title;
    var content;
    var originalSlug;
    var slug;
    var tags;

    title = req.body.title.trim();
    // Validation is annoying, automatic cleanup is awesome
    if (!title.length) {
      title = 'Updated Post';
    }

    tags = req.body.tags;

    var originalSlug = req.body.originalSlug;
    slug = apos.slugify(req.body.slug);
    if (!slug.length) {
      slug = originalSlug;
    }

    content = JSON.parse(req.body.content);
    apos.sanitizeItems(content);

    async.series([ getPost, permissions, updatePost, redirect ], sendPost);

    function getPost(callback) {
      apos.getPage(originalSlug, function(err, page) {
        if (err) {
          return callback(err);
        }
        if (!page) {
          return callback('No such blog post');
        }
        if (page.type !== 'blogPost') {
          return callback('Not a blog post');
        }
        post = page;
        return callback(null);
      });
    }

    function permissions(callback) {
      return apos.permissions(req, 'edit-post', post, function(err) {
        // If there is no permissions error then we are cool
        // enough to create a post
        return callback(err);
      });
    }

    function updatePost(callback) {
      post.title = title;
      post.slug = slug;
      post.tags = tags;
      post.areas = { body: { items: content } };
      apos.putPage(originalSlug, post, callback);
    }

    function redirect(callback) {
      apos.updateRedirect(originalSlug, slug, callback);
    }

    function sendPost(err) {
      if (err) {
        res.statusCode = 500;
        return res.send('error');
      }
      return res.send(JSON.stringify(post));
    }
  });

  app.post('/apos-blog/delete', function(req, res) {

    async.series([ getPost, permissions, deletePost], respond);

    var slug;
    var post;

    function getPost(callback) {
      slug = req.body.slug;
      return apos.getPage(slug, function(err, postArg) {
        post = postArg;
        if(!post) {
          return callback('Not Found');
        }
        if (post.type !== 'blogPost') {
          return callback('Not a blog post');
        }
        return callback(err);
      });
    }

    function permissions(callback) {
      return apos.permissions(req, 'delete-post', post, function(err) {
        // If there is no permissions error then we are cool
        // enough to delete the post
        return callback(err);
      });
    }

    function deletePost(callback) {
      apos.pages.remove({slug: post.slug}, callback);
    }

    function respond(err) {
      if (err) {
        return res.send(JSON.stringify({
          status: err
        }));
      }
      return res.send(JSON.stringify({
        status: 'ok'
      }));
    }
  });


  app.get('/apos-blog/get-posts', function(req, res) {
    self.getPosts(req, req.query, function(err, posts) {
      return res.send(JSON.stringify(posts));
    });
  });

  app.get('/apos-blog/get-post', function(req, res) {
    self.getPosts(req, req.query, function(err, posts) {
      if (posts && posts.length) {
        res.send(JSON.stringify(posts[0]));
      } else {
        res.send(JSON.stringify(null));
      }
    });
  });

  // Serve our assets. This is the final route so it doesn't
  // beat out the rest
  app.get('/apos-blog/*', apos.static(__dirname + '/public'));

  apos.addLocal('aposEditBlog', function(options) {
    return apos.partial('editBlog.html', options, __dirname + '/views');
  });

  // Returns recent posts the current user is permitted to read, in
  // blog order (reverse chrono). If criteria.editable is true, only
  // posts this user can edit are returned. All other properties of
  // criteria are merged with the MongoDB criteria object used to
  // select the relevant posts.

  self.getPosts = function(req, criteriaArg, callback) {
    if (!callback) {
      callback = options;
      options = {};
    }
    var criteria = extend({}, criteriaArg);
    var editable = criteria.editable;
    if (criteria.editable !== undefined) {
      delete criteria['editable'];
    }
    criteria.type = 'blogPost';
    if (req.query.slug) {
      criteria.slug = req.query.slug;
    }
    apos.pages.find(criteria).sort({ publishedAt: -1 }).toArray(function(err, posts) {
      if (err) {
        return callback(err);
      }
      async.filter(posts, function(post, callback) {
        apos.permissions(req, editable ? 'edit-post' : 'view-post', post, function(err) {
          return callback(!err);
        });
      }, function(posts) {
        return callback(null, posts);
      });
    });
  };

  // This is a loader function, for use with the `load` option of
  // the pages module's `serve` method.
  //
  // If the page type does not begin with "blog," this loader does nothing.
  //
  // Otherwise, if the page type begins with "blog" and the page matches the URL
  // exactly, this function serves up the "main index" page of the blog (a list of
  // posts in blog order).
  //
  // If the page is an inexact match, this function looks at the remainder of the
  // URL to decide what to do. If the remainder is of the form
  // /YYYY/MM/DD/slug, then the blog post with that slug is served (a blog
  // post permalink page).
  //
  // TODO: make this easier to extend for use in other modules like the
  // events module. Pay attention to attributes of the page to decide which
  // blog posts are relevant (like categories for blog pages in A1.5). Move
  // the default versions of the blog macros and templates into this module, with ways
  // to override them.

  self.loader = function(req, callback) {
    async.series([permissions, blog], callback);

    function permissions(callback) {
      // Load additional permissions so we know whether this person is a blogger etc.
      apos.permissions(req, 'blogger', null, function(err) {
        req.extras.blogger = !err;
        return callback(null);
      });
    }

    function blog(callback) {

      if (!req.bestPage) {
        return callback(null);
      }
      // If the page type isn't part of the blog group,
      // then this is outside our purview

      var type = pages.getType(req.bestPage.type);
      if (type.group !== 'blog') {
        return callback(null);
      }
      // We consider a partial match to be good enough, depending on the
      // remainder of the URL
      req.page = req.bestPage;

      if (req.remainder.length) {
        // Is it a blog post permalink?
        var matches = req.remainder.match(/^\/\d+\/\d+\/\d+\/(.*)$/);
        if (matches) {
          // Yep, change templates and filter to retrieve just that one blog post
          req.query.slug = matches[1];
          req.type = 'blogPost';
        } else {
          req.type = 'notfound';
        }
      } else {
        // No additional URL: index page
      }

      var criteria = {};
      if (req.page.blog && req.page.blog.tags.length) {
        criteria.tags = { $in: req.page.blog.tags };
      }
      self.getPosts(req, criteria, function(err, posts) {
        if (req.type === 'blogPost') {
          if (!posts.length) {
            req.type = 'notfound';
          } else {
            req.extras.post = posts[0];
          }
        } else {
          req.extras.posts = posts;
        }
        return callback(err);
      });
    }
  };

  // Invoke callback on next tick so that the blog object
  // is returned first and can be assigned to a variable for
  // use in whatever our callback is invoking
  process.nextTick(function() { return callback(null); });
}

