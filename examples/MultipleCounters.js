
import {
  $,
  mount, dom, dynamic,
  button, p, div
} from "../src/zodiac";


function BasicButton({text, $click}) {
  return button(
    {
      type: "button",
      $click
    },
    text
  );
}

function Counter({name, $remove}) {
  const value = $(0);

  return div({class: "margin"},
    BasicButton({
      text: [name, ": ", value.get],
      $click: value.inc
    }),
    BasicButton({
      text: "Remove",
      $click: $remove
    }));
}

// Counts the number of counters!
function CounterCounter({counters}) {
  return p("Number of counters: ", counters.length);
}

function AddCounterButton({counters}) {
  function $click() {
    const newCounter = Counter({
      name: window.prompt("Name:"),
      $remove: () => counters.drop(newCounter)
    });
    counters.push(newCounter);
  }

  return BasicButton({
    text: "More counters please!",
    $click
  })
}

function MultipleCounters() {
  const counters = $([]);

  return div({ class: "margin" },
    CounterCounter({counters}),
    dynamic(counters.get),
    AddCounterButton({counters})
  );
}

module.exports = MultipleCounters();

// mount(
//   document.body,
//   MultipleCounters());


