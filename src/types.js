
const tracker = require("./tracker");
const Clob   = require("./clob");



function eachKV(obj, fn) {
  Object.keys(obj).forEach((k) => fn(k, obj[k]));
}



const valMixin = {
  _init: (self, val) => {
    self.dep = new tracker.Dependency();
    self.set(val);
  },

  depend: (self) => self.dep.depend(),

  set: (self, val) => {
    if (self.$.validate) self.$.validate(val);
    if (self.val === val) return;
    self.val = self.$.copyVal ? self.$.copyVal(val) : val;
    self.dep.changed();
  },

  get: (self) => {
    self.dep.depend();
    return self.$.copyVal ? self.$.copyVal(self.val) : self.val;
  },

  modify: (self, fn) => {
    return self.set(fn(self.val));
  }
};

const numMixin = {
  $validate: (val) => {
    if (typeof val === "number") return;
    console.log(val);
    throw new Error("z.num expected a number");
  },

  inc: (self) => {
    self.dep.changed();
    return ++self.val;
  },

  dec: (self) => {
    self.dep.changed();
    return --self.val;
  }
};

const strMixin = {
  $validate: (val) => {
    if (typeof val === "string") return;
    console.log(val);
    throw new Error("z.str expected a string");
  }
};

const boolMixin = {
  $validate: (val) => {
    if (typeof val === "boolean") return;
    console.log(val);
    throw new Error("z.bool expected a boolean");
  },
  toggle: (self) => self.set(!self.val)
};

const types = module.exports = {
  val:  Clob(function ZVal()  {}, valMixin),
  num:  Clob(function ZNum()  {}, valMixin, numMixin),
  str:  Clob(function ZStr()  {}, valMixin, strMixin),
  bool: Clob(function ZBool() {}, valMixin, boolMixin),

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

