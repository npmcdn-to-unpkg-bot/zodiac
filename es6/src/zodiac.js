

let tracker  = require("./tracker");
let types    = require("./types");
let template = require("./nodes");
let flow     = require("./flow");

let z = module.exports = {
  tracker, types, template,
  mount: template.mount
};

Object.assign(z, tracker, types);
