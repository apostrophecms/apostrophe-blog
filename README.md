# apostrophe-blog

This bundle provides a complete foundation for blogging with the [Apostrophe CMS](http://apostrophenow.org).

The bundle consists of three Apostrophe modules (in a single npm module):

* `apostrophe-blog`
* `apostrophe-blog-pages`
* `apostrophe-blog-widgets`

The `apostrophe-blog` module provides the ability to create and edit blog posts and manage their publication dates.

The `apostrophe-blog-pages` module displays blog posts on a page. It extends the `apostrophe-pieces-pages` module. A blog page displays only blog posts whose publication date has arrived.

The `apostrophe-blog-widgets` module provides an `apostrophe-blog` widget, which you can use to select blog posts to appear anywhere on your site. Posts do not appear until their publication date.

These three modules extend `apostrophe-pieces`, `apostrophe-pieces-pages` and `apostrophe-pieces-widgets`, and you can extend them further as well.

## Example configuration

For a single blog:

```javascript
// in app.js
// We must declare the bundle!
bundles: [ 'apostrophe-blog' ],
modules: {
  'apostrophe-blog': {},
  'apostrophe-blog-pages': {},
  'apostrophe-blog-widgets': {},
  'apostrophe-pages': {
    // We must list `apostrophe-blog-page` as one of the available page types
    types: [
      {
        name: 'apostrophe-blog-page',
        label: 'Blog'
      },
      {
        name: 'default',
        label: 'Default'
      },
      {
        name: 'home',
        label: 'Home'
      }
    ]
  }
}
```

## Contextual editing

You can set the `contextual: true` option for the `apostrophe-blog` module if you prefer to allow the end user to edit the content of the article "in context" on the `show.html` page. This is generally the preferred way to go.

You can also set `contextual: true` for individual schema fields like `body` so that they don't appear in the modal at all.

When `contextual: true` is set for the module, the user is redirected to the "show page" for that blog post as soon as they click "save" so that they can edit further.

In addition, the "context menu" (the "Page menu") is enhanced with blogging-related choices when on a blog index page or show page.

## Multiple blogs

One way to create two or more blogs is to create separate blog pages on the site, and use the "with these tags" feature to display only posts with certain tags.

Another approach is to `extend` the modules, creating new modules and a completely separate admin bar item for managing the content. If you take this approach, you must set a distinct `name` property when configuring your subclass of `apostrophe-blog`, such as `article`. This will be value of `type` in the database for each blog post of this subclass.

The latter approach is often best as it requires less user training to avoid confusion. The former approach has its own advantages, notably that it is easier to aggregate content and have it appear in multiple places intentionally.

## Filtering blog posts

The index page includes filters for `day`, `month`, and `year`, meaning that parameters in query strings like `&year=2016` will automatically be passed to the mongo query that loads the pieces for your index page. You can refer to these filters in your template by using `data.piecesFilters.year`, etc.

[Check out this tutorial to learn more.](http://apostrophecms.org/docs/tutorials/intermediate/cursors.html#creating-filter-u-i-with-code-apostrophe-pieces-pages-code)
