
import z from "./src/zodiac";
const {
  cond, loop, dynamic, component, tag, text, dom,
  div, strong, ul, li, input, hr, span,
  h1, h2, h3, h4, p, a
} = z.template;

const state = z.num(0);
window.state = state;

state.persistence = z.persist(state, {

  getter: () =>
    JSON.parse(localStorage.getItem("state") || 0),

  setter: (state) =>
    localStorage.setItem("state",
      JSON.stringify(state.get()))
});

