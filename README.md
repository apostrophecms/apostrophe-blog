# apostrophe-blog

This bundle provides a complete foundation for blogging with the [Apostrophe CMS](http://apostrophenow.org).

The bundle consists of three Apostrophe modules (in a single npm module):

`apostrophe-blog`
`apostrophe-blog-pages`
`apostrophe-blog-widgets`

The `apostrophe-blog` module provides the ability to create and edit blog posts and manage their publication dates.

The `apostrophe-blog-pages` module displays blog posts on a page. It extends the `apostrophe-pieces-pages` module. A blog page displays only blog posts whose publication date has arrived.

The `apostrophe-blog-widgets` module provides an `apostrophe-blog` widget, which you can use to select blog posts to appear anywhere on your site. Posts do not appear until their publication date.

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

## Multiple blogs

One way to create two or more blogs is to create separate blog pages on the site, and use the "with these tags" feature to display only posts with certain tags.

Another approach is to `extend` the modules, creating new modules and a completely separate admin bar item for managing the content. If you take this approach, you must set a distinct `name` property when configuring your subclass of `apostrophe-blog`, such as `article`. This will be value of `type` in the database for each blog post of this subclass.

The latter approach is often best as it requires less user training to avoid confusion. The former approach has its own advantages, notably that it is easier to aggregate content and have it appear in multiple places intentionally.

