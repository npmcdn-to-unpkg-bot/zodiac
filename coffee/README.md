
## Zodiac

Reactive SPA toolkit in CoffeeScript

---

**Work in progress**

Zodiac is a simple but powerful client side toolkit for writing reactive web applications. It provides

- Reactive client side templating as CoffeeScript
- Web components
- A reactive router
- Various other useful sources of reactivity (variables, time, alerts)
- A reactivity model copied from Meteor Tracker

Some benefits:

- Less than 30k minified
- Very fast, no unecessary redraws
- Simple to use and get started
- Simple builds

Zodiac has some chosen limitations:

- CoffeeScript only
- Client side only
- IE9 and later (no support for legacy browsers)

Zodiac lets you write a whole web app (including html and reactive components) using only CoffeeScript. This makes builds simple, because you are only dealing with one dependency graph, and you can package all your code using the same tool.

You declare your reactive computational dependencies as part of your client side application logic, then simply use these reactive functions in your templates, which will render dynamically to reflect these reactive changes. Routes are simply reactive mappings from the URL to variables that you define using a routing DSL.

**Work in progress. Documentation is coming.**

### Templates

- No HTML internally, only DOM methods. No diffing needed, because the render call itself is a recursive reactive computation that will keep restructuring itself as the reactive sources change.
- No uneccessary redraws (reactivity is preserved even through for-statements, thanks to a reactive iteration variable)

### Running tests

- `npm update` installs the dev dependencies.
- `npm test` compiles the browser tests and runs them through mocha-phantomjs.
- `./node_modules/.bin/mocha -w` gives you live results for all the tests that do not require a dom.
- `cake test:build` and then opening `test/index.html` will give you in-browser test results.
