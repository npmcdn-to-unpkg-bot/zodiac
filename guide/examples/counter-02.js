import { $, mount, p, div } from "zodiac";

function Counter(initialValue) {
  const value = $(initialValue);
  return p({
      $click: value.inc
    },
    "Value: ", value.get, " (try clicking here)"
  );
}
mount(document.body,
  div(
    Counter(0),
    Counter(10),
    Counter(1336))
);
