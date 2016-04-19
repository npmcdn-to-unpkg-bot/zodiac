
import z from "./src/zodiac";

window.z = z;
window.nodes = z.template;

let {cond, h1, p, html, tag, text} = z.template;

let counter = z.var(0);

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

let renderer =
  html(
    h1({class: "yo", data: ["tick-", ticker.get]},
      "Ticker: ", [ticker.get]),

    // p({$mousemove: inc}, "Count: ", [counter.get]),
    // p({_click: inc}, "This captures events. Count: ", [counter.get]));

    cond(tickerEven,
      cond(threeish, "Theeish...",
        p({$mousemove: inc}, "Count: ", [counter.get])),
      p({_click: inc}, "This captures events. Count: ", [counter.get])));

let toggler = renderer.render(z.mount(document.body));

window.toggler = toggler;

console.log(toggler);

// function render(val) {
//
//   let counter = z.var(val);
//
//   function inc() {
//     counter.set(counter.get() + 1)
//   }
//
//   let header = h1({class: "nice"}, "Counter");
//
//   let dom = html(
//     div(
//       header,
//       p(
//         "Value: ", [counter.get], " ",
//         a({onclick: inc}, "Count!")
//       )
//     ),
//   );
//
//   return (mount, pos) => {
//     destructor = dom(mount, pos);
//     uilib.getAttention(header);
//     return () => { // destroy
//       uilib.fadeout(some_dom_node)
//       destructor()
//     }
//   }
// }



