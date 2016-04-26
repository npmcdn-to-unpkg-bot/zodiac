
import z from "./src/zodiac";
const {
  cond, loop, dynamic, component, tag, text,
  div, strong, hr, h1, h2, h3, h4, p, a, html
} = z.template;

function counterComponent(initialValue) {
  let counter = z.var(initialValue);

  function inc() {
    counter.set(counter.get() + 1);
  }

  function activated(ev) {
    console.log(ev.target);
  }

  function isEven() {
    return counter.get() % 2 == 0;
  }
  function divisibleByThree() {
    return counter.get() % 3 == 0;
  }

  return component({
    template: html(
      p({__activated: activated, },
        "Value: ", [counter.get], " ",
        a({$click: inc, href: "#"},
          "(+)")),

        p({$mousemove: inc}, "This captures mouse moves"),

        // dynamic(() => "a", {a: p("Hello!")}), // WIP

        cond(isEven,
          cond(divisibleByThree,
            p(strong("Threeish...")),
            p({$mousemove: inc}, "Count: ", [counter.get])),
          p({_click: inc}, "This captures events. Count: ", [counter.get]))
    ),
    onHide: () => console.log("Hiding component..")
  });
}

function tickerComponent(initialValue) {
  let ticker = z.ticker();

  return html(
    h4({class: "yo", data: ["tick-", ticker.get]},
      "Ticker: ", [ticker.get])
  );
}

// function liveArray() {
//   return [ticker.get(), ticker.get() + 1, ticker.get() + 2];
// }



const page =
  html(
    counterComponent(0),
    tickerComponent(0),
    // loop(liveArray,
    //     function (n) { 
    //       return html(
    //           cond(true, "x", "y"), p("Hello ", n)
    //           // counterComponent(3)
    //           )
    //     }),
    hr()
    );

const instance = z.mount(document.body, page);

window.instance = instance;
instance.toggle();

