

const tracker  = require("./tracker");
const types    = require("./types");
const template = require("./nodes");

const z = module.exports = {
  tracker, types, template,
  mount: template.mount
};

if (window) window.z = z;

Object.assign(z, tracker, types);
