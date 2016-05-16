
# Zodiac

**Pragmatic Reactive Rendering**

---

**Work in progress. Documentation is coming.**

Zodiac is a simple but powerful client side toolkit for writing reactive web applications. Let's see it in action:

    TODO: simple example

[More examples](examples)

 Zodiac provides:

- A way to track changes in data (using reactive variables)
- An HTML template syntax (using pure javascript)
- Live (reactive) dom rendering
- A suggested standard architecture (fully optional)
- Web components

It also contains:

- A reactive router
- Various other useful sources of reactivity (variables, time, alerts)
- A reactivity model copied from Meteor Tracker

Some benefits over React:

- Very fast, close to optimal renderer
- Less than 30k minified
- Less boilerplate needed to make stuff work
- Components don't have to be wrapped in a tag
- Iterators don't need a key attribute to work
- No DOM noise. No id's, classes or superfluous tags added unless you add them yourself.
- Simpler API

How is this possible? Well, everything is leaner, and there is no DOM diffing, which means no unnecessary redraws. Instead the renderer generates a live template instantiation tree. The template instantiation nodes listen for reactive changes, directly updating their corresponding DOM nodes as needed. No unnecessary computations take place, and everything works smoothly.

There are some limitations:

- Client side only
- IE9 and later (no support for legacy browsers)

#### Development

`npm update` installs dependencies.

`npm run dev` starts a local dev server with auto-reloading.

<del>`npm test` runs the test suite.</del>