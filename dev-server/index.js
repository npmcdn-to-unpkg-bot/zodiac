
import {
  $, IntervalTimer, Persist, localStorage, SerializeTo,
  mount,
  cond, loop, dynamic, component, tag, text, dom,
  div, strong, ul, li, input, button, hr, span,
  h1, h2, h3, h4, p, a
} from "../src/zodiac";

window.z = require("./../src/zodiac");

const state = $(0);

const
  ticker = $(0),
  timer = IntervalTimer(50, ticker.inc);

  // state.persistence =
  //   Persist(
  //     SerializeTo(
  //       localStorage("state")));


function* entries(obj) {
  for (var prop in obj) yield [prop, obj[prop]];
}

function* map(iterable, fn) {
  var i = 0;
  for (let item of iterable)
    yield fn(item, i++);
}

function Tabs(tabs) {
  const selection = $("MultipleCounters");
  const branches = {};

  for (let key in tabs) {
    branches[key] = tabs[key]();
  }

  return div(
    ul({class: "nav nav-tabs"},
      ...Array.from(map(entries(tabs), ([k, v]) =>
        li({class: "nav-item"}, 
            a({
              class: "nav-link",
              $click: () => selection.set(k)
            }, k)
        )
      ))
    ),

    // dynamic(selection.get, branches)
    dynamic(selection.get, {MultipleCounters: dom("test"), ArchitectureTodos: dom("yoyo")})
  );
}

import MultipleCounters from "../examples/MultipleCounters.js";
import ArchitectureTodos from "../examples/ArchitectureTodos/index.js";

function ExampleTabs() {
  return Tabs({
    MultipleCounters,
    ArchitectureTodos
  });
}

z.mount(document.body, dom(
  div({
      class: "container"
    },
    h1("Dev Playground"),
    ExampleTabs()
  )
));


