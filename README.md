
# Zodiac

**Reactive Rendering Library**

---


Zodiac is a reactive rendering library. It solves some of the same problems as tools like React, Elm, CycleJS, Riot, Polymer, Angular, Ember etc. It is very modular and minimal, while still being powerful, efficient and fun to use.

Let's see it in action:

```javascript

import { $, mount, dom, h1, p } from "zodiac";

const counter = $(0);

mount(document.body, dom(
  h1(
    { $click: counter.inc },
    "Value of counter: ",
    counter.get
  ),
  p("Click the counter to count")
));

```

Very simple. What about more advanced stuff? Just check out these examples:

- [Examples on Github](examples)

If you want to run these and try things out, just clone this repo and `npm run dev`.

[![build status](https://img.shields.io/travis/jbe/zodiac/master.svg?style=flat-square)](https://travis-ci.org/jbe/zodiac)
[![npm version](https://img.shields.io/npm/v/zodiac.svg?style=flat-square)](https://www.npmjs.com/package/zodiac)

## Concepts

### Reactivity

Zodiac uses Meteor Tracker for its reactivity model. We alter the API a little bit, but the functionality is the same. Therefore, you should read the [Tracker documentation](https://github.com/meteor/docs/blob/version-NEXT/long-form/tracker-manual.md) to understand how reactivity works in Zodiac.

### Reactive variables

In Zodiac, `$` is just a shortcut to create a new reactive variable, similar to `ReactiveVar` in Meteor.

TODO:

- Explain reactive variable API
- Write something about state trees with reactive joints and values.

### Reactive templates

All of the HTML views in a Zodiac app are described using plain javascript.

TODO: examples and API

### Standard architecture

There is a suggested standard architecture for larger zodiac apps, which you can see in some of the examples.

This architecture provides clear separation between central state (store), actions & getters (model), and templates (views / components). In this respect it is inspired by Redux and Elm, but it will let you do more with less code, and do more in general, including shooting yourself in the foot.

### Reactive router

TODO

### What about jQuery or other libs?

Zodiac will hopefully replace the need for libraries like jQuery for most applications, but you can still use it if you want. Just keep track of `$`, and Zodiac should work fine with most libraries.

### Benefits over React

- Faster renderer(? -- should be close to optimal, but not tested yet!)
- About 20k minified (without babel polyfill for older browsers)
- Much less boilerplate!
- Components don't have to be wrapped in a tag
- Iterators don't need keys
- No DOM noise. No id's, classes or superfluous tags added unless you add them yourself.
- Easier to learn
- Etc, etc..

But React is more mature and has a lot of conveniences, yeah, yeah, whatever.

### So, how does Zodiac work?

First of all, there is no DOM-diffing. Instead, the render call generates a template instantiation tree, which directly hooks reactive changes into DOM operations on their corresponding nodes, while at the same time keeping track of the correct DOM flow position of each node. The core implementation is only about 600 lines of JavaScript, so feel free to read it. `:)`
 
### Browser support

TODO! Also, Zodiac needs babel-polyfill on some browsers (looking at you, IE). See examples.

### Development

Zodiac is very alpha for now, so a lot happens in master. The tests will define the API as it matures towards v1.

`npm update` installs dependencies.

`npm run dev` starts a local dev playground with auto-reloading.

`npm karma` boots up Karma so you can see test results.
