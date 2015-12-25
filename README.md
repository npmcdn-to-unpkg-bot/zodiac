
## Zodiac

Reactive SPA toolkit in CoffeeScript

---

**Work in progress**

Zodiac is a simple but powerful client side toolkit for writing reactive web applications. It includes:

- Reactive templates (using Scorpio)
- Web components (also using Scorpio)
- Style sheets as CoffeeScript (using coffee-sheets)
- A reactive router, and some other reactive sources
- A way to do transparent reactivity called Trax (copied from Meteor Tracker)

Some benefits:

- Less than 20k minified, packaged with all dependencies
- Very fast, no unecessary redraws.
- Simple builds.

Zodiac lets you write a whole web app (including html, css, and reactive components) using only CoffeeScript. This makes builds really simple, because you only have to deal with one type of dependency graph (CommonJS), and you can package all your code using something like Browserify. Whenever your script depends on a template or some css, you just require it like you would require a script.

**Work in progress. Documentation is coming.**


