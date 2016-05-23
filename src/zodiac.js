
const
  tracker       = require("./tracker"),
  templates     = require("./templates"),
  variables     = require("./variables"),
  serialization = require("./serialization"),
  utils         = require("./utils");

const Zodiac = {
  ...tracker,
  ...templates,
  ...variables,
  ...serialization,
  ...utils,
};

module.exports = Zodiac;

if (typeof window !== "undefined")
  window.Zodiac = Zodiac;
