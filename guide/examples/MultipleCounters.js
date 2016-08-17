
import {
  $,
  mount, dom, dynamic,
  button, p, div
} from "../src/zodiac";


function BasicButton(text, $click) {
  return button(
    {
      type: "button",
      $click
    },
    text
  );
}

function margin(...children) {
  return div(
    { style: "margin: 1em 0" },
    ...children
  );
}

function CounterCounter(counters) {
  return p("Total counters: ", counters.length);
}

function CountButton(value, $remove) {
  return margin(
    BasicButton(["Count: ", value.get], value.inc),
    BasicButton("Remove", $remove)
  );
}

function AddCounterButton(counters) {
  return BasicButton(
    "More counters please!",
    () => counters.push($(0))
  );
}

function MultipleCounters() {
  const values = $([]);

  return margin(
    CounterCounter(values),
    dynamic(values.get, (value) => dom(
      CountButton(value, () => values.drop(value))
    )),
    AddCounterButton(values)
  );
}

module.exports = MultipleCounters();

// mount(
//   document.body,
//   MultipleCounters());


