
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

function Tabs(tabs) {
  const selection = $("MultipleCounters");

  return div(
    ul({class: "nav nav-tabs"},
      ...(Object.keys(tabs).map((k) =>
        li({class: "nav-item"},
            a({
              class: "nav-link",
              $click: () => selection.set(k)
            }, k)
        )
      ))
    ),
    dynamic(() => tabs[selection.get()])
  );
}

import MultipleCounters from "../examples/MultipleCounters.js";
import HelloWorld from "../examples/HelloWorld.js";

function ExampleTabs() {
  return Tabs({
    MultipleCounters,
    HelloWorld
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


