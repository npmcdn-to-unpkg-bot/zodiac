
# Zodiac

**Pragmatic Reactive Rendering**

---

**Work in progress... Better examples coming...**

Zodiac includes:

- A way to track changes in data (using reactive variables)
- An HTML template syntax (using pure javascript)
- Live (reactive) dom rendering
- A suggested standard architecture (fully optional)

Let's see it in action:

    TODO

[More examples](./tree/master/examples)


#### Advantages over React

- Faster, probably close to optimal rendering speed
- Smaller (~15kb minified)
- Less boilerplate needed to make stuff work
- Components don't have to be wrapped in a tag
- Iterators don't need a key attribute to work
- No DOM noise. No id's, classes or superflous tags added unless you add them yourself.

How is this possible? Well, there is no DOM diffing, which means no uneccessary redraws. Instead the renderer generates a live template instantiation tree. The template instantiation nodes listen for reactive changes, directly updating their corresponding DOM nodes as needed. No unecccesary computations take place, and everything works smoothly.

#### Development

`npm update` installs dependencies.

`npm run dev` starts a local dev server with auto-reloading.

<del>`npm test` runs the test suite.</del>