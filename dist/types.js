"use strict";

var tracker = require("./tracker");

var types = module.exports = {

  var: function _var() {
    var value = arguments.length <= 0 || arguments[0] === undefined ? undefined : arguments[0];

    var dep = new tracker.Dependency();
    return {
      dep: dep,
      set: function set(v) {
        if (v === value) return;
        value = v;
        dep.changed();
      },
      get: function get() {
        dep.depend();
        return value;
      }
    };
  },

  dict: function dict() {
    var vals = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var deps = {};
    return {
      deps: deps,
      set: function set(name, val) {
        if (vals[name] === val) return;
        deps[name] = deps[name] || new tracker.Dependency();
        deps[name].changed();
        vals[name] = val;
      },
      get: function get(name) {
        deps[name] = deps[name] || new tracker.Dependency();
        deps[name].depend();
        return vals[name];
      }
    };
  },

  ticker: function ticker() {
    var interval = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

    var dep = new tracker.Dependency();
    var counter = 0;
    function cb() {
      counter += 1;
      dep.changed();
    }
    var timer = window.setInterval(cb, interval);
    return {
      dep: dep,
      get: function get() {
        dep.depend();
        return counter;
      },
      stop: function stop() {
        return window.clearInterval(timer);
      }
    };
  },

  "queue": function queue() {
    var dep = new tracker.Dependency();
    var queue = [];
    return {
      dep: dep,
      put: function put() {
        var _queue;

        if (arguments.length == 0) return;
        (_queue = queue).unshift.apply(_queue, arguments);
        dep.changed();
      },
      get: function get() {
        dep.depend();
        var res = queue;
        queue = [];
        return res;
      }
    };
  },

  alerts: function alerts() {
    var queue = types.queue();

    return {
      put: function put() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        queue.put(args);
      },
      get: queue.get,

      // canonical bootstrap names
      success: function success(msg) {
        return queue.put(['success', msg]);
      },
      info: function info(msg) {
        return queue.put(['info', msg]);
      },
      warning: function warning(msg) {
        return queue.put(['warning', msg]);
      },
      danger: function danger(msg) {
        return queue.put(['danger', msg]);
      },

      // aliases
      notify: function notify(msg) {
        return queue.put(['info', msg]);
      },
      fail: function fail(msg) {
        return queue.put(['danger', msg]);
      },
      error: function error(msg) {
        return queue.put(['danger', msg]);
      }
    };
  }
};