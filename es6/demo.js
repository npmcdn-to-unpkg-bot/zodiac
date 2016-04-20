
import z from "./src/zodiac";

window.z = z;
window.nodes = z.template;

let {cond, strong, hr, h1, p, a, html, tag, text, NodeInstance} = z.template;

let counter = z.var(0);


function counterComponent(initialValue) {
  let counter = z.var(initialValue);

  function inc() {
    counter.set(counter.get() + 1);
  }

  function activated(ev) {
    console.log(ev.target);
  }

  let template =
    p({__activated: activated, },
      "Value: ", [counter.get], " ",
      a({$click: inc, href: "#"},
        "(+)"));

  return template;
}

function inc() {
  counter.set(counter.get() + 1);
}

function tickerEven() {
  return ticker.get() % 2 == 0;
}
function threeish() {
  return ticker.get() % 3 == 0;
}

let ticker = z.ticker();

// Next up: loops!

let page =
  html(
    h1({class: "yo", data: ["tick-", ticker.get]},
      "Ticker: ", [ticker.get]),

    // p({$mousemove: inc}, "Count: ", [counter.get]),
    // p({_click: inc}, "This captures events. Count: ", [counter.get]));

    cond(tickerEven,
      cond(threeish,
        strong("Threeish..."),
        p({$mousemove: inc}, "Count: ", [counter.get])),
      p({_click: inc}, "This captures events. Count: ", [counter.get])),

    counterComponent(3),
    hr()
    );

let instance = z.mount(document.body, page);

window.instance = instance;
instance.toggle();

