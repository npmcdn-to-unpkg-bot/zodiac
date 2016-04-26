"use strict";

var tracker = require("./tracker");
var types = require("./types");
var template = require("./nodes");

var z = module.exports = {
  tracker: tracker, types: types, template: template,
  mount: template.mount
};

if (window) window.z = z;

Object.assign(z, tracker, types);