
import {
  $, IntervalTimer,
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

state.persistence = z.persist(state, {
  getter: () =>
    JSON.parse(localStorage.getItem("state") || 0),

  setter: (state) =>
    localStorage.setItem("state",
      JSON.stringify(state.get()))
});

z.mount(document.body, dom(
  h1("Dev Playground"),
  p("This is a test.. ", ticker.get),
  p({$click: state.inc}, state.get),
  loop([p("hello")]),
  p(
    a({href: "#", $click: state.persistence.save}, "Save")
  )
));
