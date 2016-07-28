
# Zodiac

♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎

---

### Quickstart

Zodiac is an efficient and pragmatic reactive rendering library, similar to [React](TODO), [Ember](TODO) or [CycleJS](TODO). It can implement [TodoMVC in TODO lines of readable code](TODO) ([React-redux needs TODO lines](TODO)). Let's just start by seeing some live examples:

```javascript
import { $, mount, p } from "zodiac";

const value = $(0); // Create reactive variable
const counter = p( // Define template
  {$click: value.inc},
  "Value: ", value.get, " (try clicking here)"
  );
mount(document.body, counter); // Render to DOM
```

Let's extract a reusable `Counter` component:

```javascript
import { $, mount, p, div } from "zodiac";

function Counter(initialValue) {
  const value = $(initialValue);
  return p(
    {$click: value.inc},
    "Value: ", value.get, " (try clicking here)");
}
mount(document.body,
  div(Counter(0), Counter(10), Counter(1336))
);
```

Let's support a dynamic number of counters:

```javascript
import { $, mount, dynamic, div, p, a } from "zodiac";

function Counter(value) {
  return p(
    {$click: value.inc},
    "Value: ", value.get, " (try clicking here)");
}

const counters = $([ $(0), $(10) ]);

mount(document.body,
  div(
    dynamic(counters.get, Counter),
    a({
      href: "#",
      $click: function(e) {
        e.preventDefault();
        counters.push($(1337));
      }
    },
    "Add another counter")
  )
);
```

As you can see, Zodiac lets you write HTML templates using only plain JavaScript functions. Components are expressed as functions too, and as of such they are a lot like regular tags. Reactivity is accomplished by tracking changes per variable; there is no big JSON-like structure like in [Redux](TODO), and no DOM diffing, like in [React](TODO). Instead, we use the `$` *reactive variable constructor* to wrap our data model variables.

`$(0)` returns a reactive variable with the value `0`. This "reactive variable" is an object with `get` and `set` methods, as well as some convenience methods like `inc`, `dec`, `reset`, `toggle`, `push`, and more. The point of using a reactive variable instead of a plain one, is that we can listen for changes to its value. The template does this to keep itself updated as the data changes. Whenever we reference the `get` method in a template definition, it will be able to monitor changes, and update the dom accordingly. This is what happens above.

This direct linking between variables and template nodes makes dom-diffing unecessary in Zodiac, which in turn also makes Zodiac fast.

Don't despair if this all sounds a bit ♈ ♉ ♊ ♋, because we will spend the rest of this guide explaining it in detail. We will cover:

1. Reactivity, the "tracker" and reactive variables
2. Templates, components and shared logic
3. Rendering
4. Architecture for larger applications

There is also a comprehensive API reference.

All the examples in this guide are written using [EcmaScript2015](TODO). You might want to quickly read up on that before starting if you have not already.

```javascript
import { mount, h3 } from "zodiac";
mount(document.body, h3("Hello universe!"));
```
