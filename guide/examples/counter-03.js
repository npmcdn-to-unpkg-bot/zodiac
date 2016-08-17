import { $, mount, dynamic, div, p, a } from "zodiac";

function Counter(value) {
  return p({
      $click: value.inc
    },
    "Value: ", value.get, " (try clicking here)"
  );
}

const counters = $([ $(0), $(10) ]);

mount(document.body,
  div(
    dynamic(counters.get, Counter),
    a({
      href: "#",
      $click: function(e) {
        e.preventDefault();
        counters.push($(1337));
      }
    },
    "Add another counter")
  )
);
