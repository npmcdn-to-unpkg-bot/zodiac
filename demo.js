
import z from "./dist/zodiac";
const {
  cond, loop, dynamic, component, tag, text,
  div, strong, hr, h1, h2, h3, h4, p, a, dom
} = z.template;

const remembered = z.persistent(z.var, "remembered", 0);
window.remembered = remembered;


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
    template: dom(
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

  function isEven() {
    return ticker.get() % 2 == 0;
  }

  return dom(
    h4({class: [() => isEven() && "yo"], data: ["tick-", ticker.get]},
      "Ticker: ", [ticker.get])
  );
}

// function liveArray() {
//   return [ticker.get(), ticker.get() + 1, ticker.get() + 2];
// }



const page =
  dom(
    counterComponent(0),
    tickerComponent(0),
    // loop(liveArray,
    //     function (n) { 
    //       return dom(
    //           cond(true, "x", "y"), p("Hello ", n())
    //           // counterComponent(3)
    //           )
    //     }),
    hr()
    );

const instance = z.mount(document.body, page);

window.instance = instance;
instance.toggle();

