$.extend(true, window, {
  aposPages: {
    groups: {
      blog: {
        settings: {
          sel: '.apos-page-settings-blog',
          serialize: function($el) {
            return { tags: apos.tagsToArray($el.find('[data-type-details] [name="blog[tags]"]').val()) };
          },
          unserialize: function(data, $el) {
            $el.find('[data-type-details] [name="blog[tags]"]').val(apos.tagsToString(data.tags));
          }
        }
      }
    }
  }
});

$.extend(true, window, {
  aposBlog: {
    enableUI: function(options) {
      if (!options) {
        options = {};
      }

      aposBlog.options = options;

      // Make a new post
      $('body').on('click', '[data-new-post]', function() {
        var $el = apos.modalFromTemplate('.apos-new-post', {
          save: function(callback) {
            return addOrEdit($el, 'new', {}, callback);
          },
          init: function(callback) {
            return enableArea($el, [], callback);
          }
        });
        return false;
      });

      // Manage all posts
      $('body').on('click', '[data-edit-posts]', function() {
        var slug = $(this).data('slug');
        var posts;
        var $el = apos.modalFromTemplate('.apos-edit-posts', {
          init: function(callback) {
            // We want to know if a blog post is modified
            $el.attr('data-apos-trigger-blog', '');
            // Trigger an initial refresh
            $el.trigger('apos-change-blog', callback);
          }
        });

        // Allows things like the new blog post and edit blog post dialogs to
        // tell us we should refresh our list

        $el.on('apos-change-blog', function(e, callback) {
          $.getJSON('/apos-blog/get-posts', { editable: true }, function(data) {
            posts = data;
            $posts = $el.find('[data-posts]');
            $posts.find('[data-post]:not(.apos-template)').remove();
            _.each(posts, function(post) {
              var $post = apos.fromTemplate($posts.find('[data-post].apos-template'));
              var $title = $post.find('[data-post-title]');
              $title.text(post.title);
              $title.attr('data-slug', post.slug);
              $posts.append($post);
            });
            if (callback) {
              return callback(null);
            }
          });
        });
      });

      // Edit one post
      $('body').on('click', '[data-edit-post]', function() {
        var slug = $(this).data('slug');
        var post;
        var $el = apos.modalFromTemplate('.apos-edit-post', {
          save: save,
          init: function(callback) {
            $.getJSON('/apos-blog/get-post', { slug: slug, editable: true }, function(data) {
              if (!data) {
                alert('That post does not exist or you do not have permission to edit it.');
                return callback('no such post');
              }
              post = data;
              apos.log('I got a post');
              $el.find('[name=title]').val(post.title);
              $el.find('[name=tags]').val(apos.tagsToString(post.tags));
              $el.find('[name=slug]').val(post.slug);

              apos.suggestSlugOnTitleEdits($el.find('[name=title]'), $el.find('[name=slug]'));

              $el.on('click', '[data-action="delete"]', function() {
                if (confirm('Are you sure you want to delete this post permanently and forever?')) {
                  $.post('/apos-blog/delete', { slug: slug }, function(data) {
                    apos.change('blog');
                    $el.trigger('aposModalHide');
                  }, 'json');
                }
                return false;
              });

              enableArea($el, post.areas.body ? post.areas.body.items : [], callback);
            });
          }
        });
        function save(callback) {
          return addOrEdit($el, 'edit', { slug: slug }, callback);
        }
        return false;
      });

      function enableArea($el, content, callback) {
        $.post('/apos/edit-virtual-area', { content: JSON.stringify(content) }, function(data) {
            var editView = $el.find('[data-body-edit-view]');
            editView.append(data);
            return callback(null);
          }
        );
      }

      function addOrEdit($el, action, options, callback) {
        $.ajax(
          {
            url: '/apos-blog/' + action,
            data: {
              title: $el.find('[name="title"]').val(),
              tags: apos.tagsToArray($el.find('[name="tags"]').val()),
              slug: $el.find('[name="slug"]').val(),
              type: $el.find('[name="type"]').val(),
              content: apos.stringifyArea($el.find('[data-editable]')),
              originalSlug: options.slug
            },
            type: 'POST',
            dataType: 'json',
            success: function(data) {
              // Let anything that cares about changes to the blog know
              apos.change('blog');
              return callback(null);
            },
            error: function() {
              alert('Server error');
              return callback('Server error');
            }
          }
        );
        return false;
      }
    }
  }
});
