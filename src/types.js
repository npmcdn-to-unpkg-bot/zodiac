
const tracker = require("./tracker");

function eachKV(obj, fn) {
  Object.keys(obj).forEach((k) => fn(k, obj[k]));
}

function zVal(val) {
  this.prototype = {};

  this.dep = new tracker.Dependency();
  this.depend = () => this.dep.depend();

  this.get = () => {
    this.dep.depend();
    return this.prototype.copyVal
      ? this.prototype.copyVal(this._val)
      : this._val;
  };

  this.set = (val) => {
    if (this.prototype.validate) this.prototype.validate(val);
    if (this._val === val) return;
    this._val = this.prototype.copyVal
      ? this.prototype.copyVal(val)
      : val;
    this.dep.changed();
  };

  this.set(val);
}

function zNum(val) {
  zVal.call(this, val);

  this.prototype.validate = (val) => {
    if (typeof val === "number") return;
    console.log(val);
    throw new Error("z.num expected a number");
  };

  this.inc = () => {
    this.dep.changed();
    return ++this._val;
  };

  this.dec = () => {
    this.dep.changed();
    return --this._val;
  };
}

function zStr(val) {
  zVal.call(this, val);

  this.prototype.validate = (val) => {
    if (typeof val === "string") return;
    console.log(val);
    throw new Error("z.str expected a string");
  };
}

function zBool(val) {
  zVal.call(this, val);

  this.prototype.validate = (val) => {
    if (typeof val === "boolean") return;
    console.log(val);
    throw new Error("z.bool expected a boolean");
  };

  this.toggle = () => this.set(!this._val);
}

const types = module.exports = {
  val:  () => new zVal(...arguments),
  num:  () => new zNum(...arguments),
  str:  () => new zStr(...arguments),
  bool: () => new zBool(...arguments),

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
    let saved = z.bool(false);
    state.set(getter());

    tracker.autorun(() => {
      state.depend();
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

