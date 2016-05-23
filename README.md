
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

If you want to run these examples and try things out, just clone this repo and run `npm run dev`.

## Concepts

### Reactivity in Zodiac

Zodiac uses Meteor Tracker for its reactivity model. We alter the API a little bit, but the functionality is the same. Therefore, you should read the [Tracker documentation](https://github.com/meteor/docs/blob/version-NEXT/long-form/tracker-manual.md) to understand how reactivity works in Zodiac.

### Reactive variables

In Zodiac, `$` is just a shortcut to `new Tracker.Dependency`.

TODO: Write something about state trees with reactive joints asnd values.

### Reactive templates

All of the HTML views in a Zodiav app are described using plain nested javascript functions. These calls produce a template definition that can be rendered reactively and stay live as data changes.

One of the biggest benefits of this, is that it becomes very easy to extract partial template logic into functions representing generic components. These functions can even take other template definitions or functions as parameters, so it becomes very easy to create higher-order components. And they are actually not that hard to understand, once you see them.

### Standard architecture

I have written some examples to demonstate a suggested standard architecture for larger zodiac apps. This architecture provides clear guidelines on where to store different kinds of code, and provides a very clear separation between central state, state operations, and components. In this respect it is inspired by Redux and Elm. Zodiac is however more pragmatic than these libraries, and will let you do more with less code, and do more in general. You have to be disciplined in order to use this.

### Reactive router

TODO

### What about jQuery or other libs?

Zodiac will hopefully replace the need for libraries like jQuery for a lot of use cases, but you can still use it if you want. Just keep track of `$`, and Zodiac should work fine with most libraries.

# Benefits over React

- Faster renderer(? -- should be close to optimal, but not tested yet!)
- About 20k minified (without babel polyfill for older browsers)
- Much less boilerplate!
- Components don't have to be wrapped in a tag
- Iterators don't need keys
- No DOM noise. No id's, classes or superfluous tags added unless you add them yourself.
- Easier to learn
- Etc, etc..

But React is more mature and has a lot of conveniences, sure.

### So, how does Zodiac work?

First of all, there is no DOM-diffing. Instead, the render call generates a template instantiation tree, which directly hooks reactive changes into DOM operations on their corresponding nodes, while at the same time keeping track of the correct DOM flow position of each node.
 
### Browser support

TODO!
Also, Zodiac needs babel-polyfill on some browsers (looking at you, IE). See examples.

#### Development

`npm update` installs dependencies.

`npm run dev` starts a local dev playground with auto-reloading.

`npm karma` boots up Karma so you can see test results.
