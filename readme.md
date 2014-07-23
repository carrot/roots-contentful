Roots Contentful
================

[![npm](https://badge.fury.io/js/roots-contentful.png)](http://badge.fury.io/js/roots-contentful) [![tests](https://travis-ci.org/carrot/roots-contentful.png?branch=master)](https://travis-ci.org/carrot/roots-contentful) [![dependencies](https://david-dm.org/carrot/roots-contentful.png?theme=shields.io)](https://david-dm.org/carrot/roots-contentful)

An extension for using roots with the Contentful CMS API.

> **Note:** This project is in early development, and versioning is a little different. [Read this](http://markup.im/#q4_cRZ1Q) for more details.

### Why Should You Care?

We love static sites. They're fast, resilient, simple, and cheap.

However, managing and updating content on a static site is a pain. This extension allows you to load data from [Contentful's](https://www.contentful.com/) API into your roots project for use in your view templates during compilation. Non-developers get an easy way to publish and manage content, while developers can still build static sites in a sane way.

### Installation

- make sure you are in your roots project directory
- `npm install roots-contentful --save`
- modify your `app.coffee` file to include the extension, as such

```coffee
contentful = require 'roots-contentful'

# ...

module.exports =
  extensions: [
    contentful({
      access_token: 'YOUR_ACCESS_TOKEN'
      space_id: 'xxxxxx'
      content_types: [
        {
          id: 'xxxxxx',
          name: 'posts',
          template: 'views/_post.jade',
          filters: {
            'fields.environment[in]': ['staging', 'production']
          },
          path: (e) -> "blogging/#{e.category}/#{slugify(e.title)}"
        },
        {
          id: 'xxxxxx'
        }
      ]
    })
  ]

# ...
```

### Usage

#### Accessing Content in Views

A `contentful` view helper object will be passed into every view containing your content. Each content type will be set as a property on `contentful` using the `name` option in your `app.coffee` configuration. For example with the `app.coffee` file above, you can access the blog posts like this:

```jade
  h1 Hello World
  ul
    - for post in contentful.posts
      li
        h2= post.title
        p= markdown(post.body)
```

#### Single Entry Views

If a `template` option is defined for a Content Type in `app.coffee`, roots will compile a single page view for each entry in that Content Type collection. The entry will also have a `_url` key that returns the path to the single page view (so you can create links on an index page for example).

#### The Entry Object

Contentful's [documentation](https://www.contentful.com/developers/documentation/content-delivery-api/#getting-entry) shows the response the API returns when fetching an entry. It looks something like this:

```json
{
  "sys": {
    "type": "Entry",
    "id": "cat"
    # ...
  },
  "fields": {
    "title": "Wow. Such title. Much viral",
    "author": "The Doge of Venice"
    # ...
  }
}
```

As a convenience, the entry object roots-contentful makes available in your views will have the `fields` key's value set one level higher on the object. System metadata remains accessible on the `sys` key and roots-contentful will raise an error if you have a field named `sys`. Thus, the entry object above will have this structure inside your views:

```json
{
  "title": "Wow. Such title. Much viral",
  "author": "The Doge of Venice"
  # ... the rest of the fields
  "sys": {
    "type": "Entry",
    "id": "cat"
    # ...
  }
}
```

### Configuration Options

#### access_token

Required. Your Contentful Delivery access token (API key).

#### space_id

Required. The space ID containing the content you wish to retrieve.

#### content_types

An array of objects specifying from which Content Types you wish to fetch entries.

### Configuring a `content_type`  
Each object in the content_types array can have the following properties:

#### id

Required. The Content Type's ID on Contentful.

#### name

Optional. This is the name of the key the entries will be attached to on the `contentful` object in your views. Defaults to a [pluralized](https://github.com/blakeembrey/pluralize), [underscored](http://stringjs.com/#methods/underscore) representation of the Content Type name (e.g. 'Blog Post' => `contentful.blogPosts`)

#### template

Optional. Path relative to the roots project of a template for a single entry view. Each entry in the Content Type will be passed into the template in an `entry` variable. If not given, the Content Type will not be compiled into single entry views and will only be attached to the `contentful` view helper object.

#### filters

Optional. Takes an object with different filter criteria, see examples of how to structure the object in [Contentful's docs](https://www.contentful.com/developers/documentation/content-delivery-api/javascript/#search-filter).

#### path

Optional. Provide a function that returns a string of the relative path to the output file for a given entry without the extension. First argument passed into the function is the entry. Default is `<name>/<slug>` where `slug` is the [slugified](http://stringjs.com/#methods/slugify) output of the entry's `displayField` (a property of the Content Type), and `name` is the provided `name` option above or the default value. This option is ignored if no `template` is given.

### License & Contributing

- Details on the license [can be found here](LICENSE.md)
- Details on running tests and contributing [can be found here](contributing.md)
