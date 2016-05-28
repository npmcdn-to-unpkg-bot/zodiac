

import {
  dom,
  h3,
  p
} from "../src/zodiac";

module.exports = dom(
  // the dom function lets you return more than one tag
  // without having to wrap them in another tag.
  h3("Template dom syntax example"),
  p("This is a paragraph"),

  p("There ", "can ", "be any number of text items in a tag")
);

