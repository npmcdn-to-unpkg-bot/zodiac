

let tracker  = require("./tracker");
let types    = require("./types");
let template = require("./template");

let z = module.exports = { tracker, types, template };

Object.assign(z, tracker, types);
