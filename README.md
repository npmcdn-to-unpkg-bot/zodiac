
## Zodiac

Reactive SPA toolkit in CoffeeScript

---

**Work in progress**

Zodiac is a simple but powerful client side toolkit for writing reactive web applications. It provides

- Reactive client side templating
- Web components
- Style sheets as CoffeeScript
- A reactive router, and some other sources of reactivity
- A reactivity model copied from Meteor Tracker

Some benefits:

- Less than 20k minified, packaged with all dependencies
- Very fast, no unecessary redraws
- Simple builds for you

Limitations that will not change:

- CoffeeScript only
- Client side only (excluding the build tools)
- Browserify-style builds only

Zodiac lets you write a whole web app (including html, css, and reactive components) using only CoffeeScript. This makes builds really simple, because you only have to deal with one type of dependency graph (CommonJS), and you can package all your code using something like Browserify. Whenever your script depends on a template or some css, you just require it like you would require a script.

You declare your reactive computational dependencies as part of your client side application logic, then simply use these reactive functions in your templates, which will update the dom dynamically to reflect reactive changes in the application data. Wahoooo!

**Work in progress. Documentation is coming.**

### Coffee sheets

Small utility that lets you define CSS rules using only CoffeeScript, and then dynamically add those to a style tag in the current page. Coffee sheets are meant to be used by web components that need to add style rules to the current page whenever they are rendered for the first time.

In order to minimize unpredictable rule overrides depending on order of requiry, we use several "levels", so that different coffee sheets included after one another get interlaced rather than being concatenated in the order of inclusion.

Why would anyone use CoffeeScript to write CSS? Mostly to make the styles part of the same dependency graph as the rest of the code, but also potentially in order to delay the loading of styles until those styles are actually needed.

## Templates

- No HTML internally, only DOM methods! No stupid tree diff!
- No uneccessary redraws (separation of reactive content is preserved, even through for-statements, thanks to a reactive iteration variable)
