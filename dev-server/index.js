
import {
  $, IntervalTimer,
  mount,
  cond, loop, dynamic, component, tag, text, dom,
  div, strong, ul, li, input, button, hr, span,
  h1, h2, h3, h4, p, a
} from "../src/zodiac";

window.z = require("./../src/zodiac");

const state = $(0);
window.state = state;

const
  ticker = $(0),
  timer = IntervalTimer(50, ticker.inc);


const todos = $([
  {
    text: $("Buy Milk"),
    completed: $(false)
  }
]);

function createTodo(text) {
  return {
    text: $(text),
    completed: $(false)
  };
}

function addTodo(text) {
  todos.push(createTodo(text));
}

state.persistence = z.persist(state, {
  getter: () =>
    JSON.parse(localStorage.getItem("state") || 0),

  setter: (state) =>
    localStorage.setItem("state",
      JSON.stringify(state.get()))
});

z.mount(document.body, dom(
  h1("Hello"),
  p("This is a test.. ", [ticker.get]),
  p({$click: state.inc}, [state.get]),
  p(
    a({href: "#", $click: state.persistence.save}, "Save")
  ),
  loop(todos.get, (todo) =>
    p([() => todo().text.get()])
  ),
  button({
    $click: () => addTodo("test"),
    type: "button"
  },
    "Add todo"),
  button({
    $click: todos.pop,
    type: "button"
  },
    "Remove todo")
));
