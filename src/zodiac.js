

const tracker    = require("./tracker");
const variables  = require("./variables");
const templates  = require("./templates");
const utils      = require("./utils");

const Zodiac = {
  ...variables,
  ...utils,
  ...templates,
  autorun: tracker.autorun,
  nonreactive: tracker.nonreactive
};

module.exports = Zodiac;

if (typeof window !== "undefined")
  window.Zodiac = Zodiac;