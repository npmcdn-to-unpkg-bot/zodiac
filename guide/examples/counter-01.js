import { $, mount, p } from "zodiac";

const value = $(0);
const counter = p({
    $click: value.inc
  },
  "Value: ", value.get, " (click here)"
);
mount(document.body, counter);
