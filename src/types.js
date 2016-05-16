
const tracker = require("./tracker");

function eachKV(obj, fn) {
  Object.keys(obj).forEach((k) => fn(k, obj[k]));
}

function Variable(val) {
  this.dep = new tracker.Dependency();
  this.watch = () => this.dep.depend();

  this.get = () => {
    this.dep.depend();
    return this._val;
  };

  this.set = (val) => {
    if (this._val === val) return;
    this._val = val;
    this.dep.changed();
  };

  this.set(val);

  this.toggle = () => this.set(!this._val);

  this.inc = () => {
    this.dep.changed();
    return ++this._val;
  };

  this.dec = () => {
    this.dep.changed();
    return --this._val;
  };

  this.push = (val) => {
    this.dep.changed();
    this._val.push(val);
  };

  this.pop = (val) => {
    if (this._val.length > 0) this.dep.changed();
    return this._val.pop();
  };

  this.unshift = (val) => {
    this.dep.changed();
    this._val.unshift(val);
  };

  this.shift = (val) => {
    if (this._val.length > 0) this.dep.changed();
    return this._val.shift();
  };
}

// TODO: clone on set, clone on get.
// TODO: cleanup

const types = module.exports = {
  variable:  (...args) => new Variable(...args),

  // TODO...
  dict: function (vals={}) {
    let deps = {};
    vals = Object.assign({}, vals);
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

  list: function (vals) {
  // z.list
  //   push
  //   pop
  //   shift
  //   unshift
  //   slice
  //   splice
  //   dropAt
  //   drop
  //   mapValues
  //   filter
  //   reduce
  //   // flatten
  //   // flatMap
  //   pushStream // returns the stream
  //   shiftStream
  },

  ticker: function (interval=1000) {
    let dep     = new tracker.Dependency();
    let counter = 0;
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
  },

  persist: function(state, {getter, setter}) {
    let saved = z.variable(false);
    state.set(getter());

    tracker.autorun(() => {
      state.watch();
      saved.set(false);
    });

    saved.set(true);

    return {
      save: () => {
        setter(state);
        saved.set(true);
      },
      reload: () => state.set(getter()),
      saved
    };
  }
}

