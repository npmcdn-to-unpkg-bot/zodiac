

let tracker  = require("./tracker");
let types    = require("./types");
let template = require("./template");
let flow     = require("./flow");

let z = module.exports = {
  tracker, types, template,
  mount: flow.root
};

Object.assign(z, tracker, types);
