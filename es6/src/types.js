
let tracker = require("./tracker");

let types = module.exports = {

  var: function (value=undefined) {
    let dep = new tracker.Dependency();
    return {
      dep: dep,
      set: function (v) {
        if (v === value) return;
        value = v;
        dep.changed();
      },
      get: function () {
        dep.depend();
        return value;
      }
    };
  },

  dict: function (vals={}) {
    let deps = {};
    return {
      deps: deps,
      set: function (name, val) {
        if (vals[name] === val) return;
        deps[name] = deps[name] || new tracker.Dependency();
        deps[name].changed();
        vals[name] = val;
      },
      get: function (name) {
        deps[name] = deps[name] || new tracker.Dependency();
        deps[name].depend();
        return vals[name];
      }
    }
  },

  ticker: function (interval=1000) {
    let dep     = new tracker.Dependency()
    let counter = 0
    function cb() {
      counter += 1;
      dep.changed();
    }
    let timer = window.setInterval(cb, interval);
    return {
      dep: dep,
      get: function () {
        dep.depend();
        return counter;
      },
      stop: () => window.clearInterval(timer)
    }
  },

  "queue": function () {
    let dep   = new tracker.Dependency();
    let queue = [];
    return {
      dep: dep,
      put: function (...args) {
        if (args.length == 0) return;
        queue.unshift(...args);
        dep.changed();
      },
      get: function () {
        dep.depend();
        let res = queue;
        queue = [];
        return res;
      }
    }
  },

  alerts: function () {
    let queue = types.queue()

    return {
      put: function(...args) { queue.put(args); },
      get: queue.get,

      // canonical bootstrap names
      success:  (msg) => queue.put(['success', msg]),
      info:     (msg) => queue.put(['info',    msg]),
      warning:  (msg) => queue.put(['warning', msg]),
      danger:   (msg) => queue.put(['danger',  msg]),

      // aliases
      notify:   (msg) => queue.put(['info',    msg]),
      fail:     (msg) => queue.put(['danger',  msg]),
      error:    (msg) => queue.put(['danger',  msg])
    };
  }
}


