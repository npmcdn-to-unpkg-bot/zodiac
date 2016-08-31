
>>> SECTION 1 README

>>> KEYWORDS introduction

# Zodiac

---

>>> SECTION 1.1 Preface

Zodiac is a reactive rendering library for JavaScript applications.

It is slightly inspired by (and somewhat similar in scope to) [React](TODO)/[Redux](), [Elm](TODO) and [CycleJS](TODO). Compared to these, Zodiac mostly stands out in terms of how it models state changes, components, and data flow. In my humble opinion, it provides these benefits:

- Ease of refactoring
- Fast render updates
- Tiny bundle; ~20kb
- No boilerplate
- Does not enforce any architecture

>>> EXAMPLE elevator-pitch.js

Like all code, it still unavoidably contains some (carefully chosen but imperfect) opinions about how to model things. And even though Zodiac is powerful, shooting yourself in your proverbial foot is as easy as ever. It's pretty great though.

[badges]

### Installation

Most users will want to require (as in [CommonJS](TODO)) Zodiac inside a NodeJS environment, and generate application bundles using [Webpack](TODO), [Rollup](TODO) or something similar. However, you can also include a preminified bundle if you like.

Be aware that you will need to include the babel polyfill as well for Zodiac to work in all browsers. This dependency will probably be removed in a future version.

Using NodeJS and npm: `npm install --save zodiac`

-- Or --

Using unpkg bundle: `TODO`

The source code itself was written in ES2015 with some additions, but this is all pre-transpiled to ES5 for the actual packages, which means they will work in any modern browser with babel polyfill.

### Toolchain

TODO: Webpack, tests, Karma, Rails etc, etc. Basically the same as other js frameworks. should mostly just work.

### Technology / How does it work?

Zodiac does not perform DOM diffing. Instead, it uses an even faster technique which is explained later in this guide.

It is also worth noting that it actually uses the same reactivity model as [Meteor](TODO), known as [Tracker](TODO). Although Meteor is a big framework, Tracker itself is quite minimal (a few hundred lines of code).

### The Guide

The Zodiac Guide (you are now reading it) contains everything you need to know and more, from quickstart to in-depth topics, along with examples and an API reference. You can actually edit all of the examples too (try, and you will see the results change).

All the examples use [ES2015](TODO), even though you could theoretically use any dialect of JavaScript with Zodiac. In fact this page loads the entire babel transpiler client-side in order to support ES2015.

Finally, you can always click the icon in the top left to see the chapter index.

[versioning. change log, semver]

[example code on the right] -- The gist of a simple app



### Quickstart

TODO: rewrite after finishing TOC.

>>> EXAMPLE counter-01.js

Let's support a dynamic number of counters:

>>> EXAMPLE counter-02.js
>>> EXAMPLE counter-03.js


As you can see, Zodiac lets you write HTML templates using only plain JavaScript functions. Components are expressed as functions too, and as of such they are a lot like regular tags. Reactivity is accomplished by tracking changes per variable; there is no big JSON-like structure like in [Redux](TODO), and no DOM diffing, like in [React](TODO). Instead, we use the `$` *reactive variable constructor* to wrap our data model variables.

`$(0)` returns a reactive variable with the value `0`. This "reactive variable" is an object with `get` and `set` methods, as well as some convenience methods like `inc`, `dec`, `reset`, `toggle`, `push`, and more. The point of using a reactive variable instead of a plain one, is that we can listen for changes to its value. The template does this to keep itself updated as the data changes. Whenever we reference the `get` method in a template definition, it will be able to monitor changes, and update the dom accordingly. This is what happens above.

This direct linking between variables and template nodes makes dom-diffing unecessary in Zodiac, which in turn also makes Zodiac fast.

Don't despair if this all sounds a bit strange, because we will spend the rest of this guide explaining it in detail. We will cover:

1. Reactivity, the "tracker" and reactive variables
2. Templates, components and shared logic
3. Rendering
4. Architecture for larger applications

There is also a comprehensive API reference.

All the examples in this guide are written using [EcmaScript2015](TODO). You might want to quickly read up on that before starting if you have not already.

---
♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎


>> Various from old README:

### Benefits over React

- Faster renderer(? -- should be close to optimal, but not tested yet!)
- About 20k minified (without babel polyfill for older browsers)
- Much less boilerplate
- Components don't have to be wrapped in a tag
- Looped (iterated) elements don't need keys
- No DOM noise. No id's, classes or superfluous tags added unless you add them yourself.

### Big con

- Still in development

### How does Zodiac work?

First of all, there is no DOM-diffing. Instead, the render call generates a template instantiation tree, which directly hooks reactive variable changes into DOM operations on their corresponding nodes, while at the same time keeping track of the correct DOM flow position of each node. The core implementation is in fact less than 500 lines of JavaScript, even though it is slightly complicated.

Basically there are two different tree structures at work; the template definition tree, and one or more template instantiation trees. The definition tree defines the appearance and behaviour of a template, while the instantiation trees maintain the current state of a definition tree being rendered. Each instantiation node has a corresponding definition node in the definition tree. However, a template definition node may have several instantiations, or none at all, at some point in time. This is because of loops and if-statements in the template. -- Anything underneath a loop could get rendered several times to the DOM.

Templates are implicitly linked to their underlying data, and know what DOM operations to perform when those data change. Again, see the guide to get a feel for how this works in practice.

### Browser support

Zodiac needs babel-polyfill on certain browsers (looking at you as always, IE). See examples.

TODO: specify supported versions. This probably comes down to event listener code. Also try to find a replacement for babel polyfill, or even for babel itself. perhaps consider transpiling coffeescript.

### Development

Zodiac is in alpha for now, and most things happen in master. As the API matures towards v1, I will begin to add tests to cement it.

- Clone repo.
`npm update` installs dependencies.
`npm run dev` starts a local dev playground (it's just the guide with hot-reloading of the zodiac source itself).
`npm karma` boots up Karma so you can test across browsers



>> Serialization:

state  = $(0)
timer  = IntervalTimer(50, state.inc)

  # // state.persistence =
  # //   Persist(
  # //     SerializeTo(
  # //       localStorage("state")));
