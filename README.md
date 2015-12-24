
## Zodiac

Reactive DOM rendering and templates, based on Tracker

---

**Work in progress**

Zodiac is...

- A way to write reactive web components.
- Two DSL's inside CoffeeScript (for html and css templates).
- A reactive renderer interacting directly with the DOM (no diffing!).
- A way to do reactivity, with some tools included.
- Largely based on Meteor Tracker.
- Much smaller and much faster than something like React

Zodiac lets you write a whole web app (including html, css, and reactive components) using only CoffeeScript. This makes builds really simple, because you only have to deal with one type of dependency graph (CommonJS), and you can package all your code using something like Browserify. Whenever your script depends on a template or some css, you just require it like you would require a script.
