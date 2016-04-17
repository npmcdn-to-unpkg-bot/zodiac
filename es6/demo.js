
import z from "./src/zodiac";

window.z = z;

let {h1, p, html, tag, text} = z.template;

let para = document.createElement("p");
document.body.appendChild(para);

let ticker = z.ticker();
let renderer = html(
                h1({class: "yo", data: ["tick-", ticker.get]},
                  "Ticker: ", [ticker.get]),
                p("This is a paragraph."));
let destructor = renderer(document.body);

window.destructor = destructor;

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
//
//
