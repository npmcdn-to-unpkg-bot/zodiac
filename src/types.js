
const tracker = require("./tracker");

const types = module.exports = {

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

  persistent: function(ctor, name, defaultValue) {
    let item = localStorage.getItem(name) || defaultValue;
    let variable = ctor(item);
    tracker.autorun(() => localStorage.setItem(name, variable.get()));
    return variable;
  }

}



function eachKV(obj, fn) {
  Object.keys(obj).forEach((k) => fn(k, obj[k]));
}

class Atom {
  constructor(val) {
    this._dep = new tracker.Dependency();
    if (this.subConstructor) this.subConstructor();
    if (val !== undefined) this.set(val);
  }

  // Return the sub-atom at the given location, or throw an error if it
  // does not exist.
  sel(...path) {
    let fragments = [].concat.apply(
      path.map((p) => typeof(p) == "string" ? p.split('/') : p))
      .filter((p) => p !== undefined);
    return fragments.length == 0
      ? this
      : this._sel(fragments);
  }

  _strictSel(path) {
    let subAtom = this.sel(...path);
    if (!subAtom) {
      console.log(path);
      throw new Error('Nonexistent scope.');
    }
    return subAtom;
  }

  // Returns the value of this atom or an optionally specified sub-atom
  get(...path) {
    let atom = this._strictSel(path);
    atom._dep.depend();
    return atom._get();
  }

  // Sets the value of this atom or an optionally specified sub-atom
  set(...pathAndVal) {
    let
      val    = pathAndVal.pop(),
      path   = pathAndVal;
    return this.sel(...path)._set(val);
  }

  _changed() {
    this._dep.changed();
    if (this._parent) this._parent._changed();
  }

  modify(fn) { this.set(fn(this.get())); }
}

class ValueAtom extends Atom {
  _validate(val) {
    let valid = !val
      || typeof(val) == 'boolean'
      || typeof(val) == 'string'
      || typeof(val) == 'number';
    if (valid) return;
    console.log(val);
    throw new Error('Value atom expected string, number or falsey type.');
  }

  _sel()    { return undefined; }
  _get(val) { return this._val }

  _set(val) {
    if (this._val === val) return false;
    this._validate(val);
    this._val = val;
    this._changed();
    return true;
  }

  inc()   { this._val++; this._changed(); }
  dec()   { this._val--; this._changed(); }
  flip()  { this._val = !this._val; this._changed(); }
}

class ListOrObjectAtom extends Atom {
  subConstructor() {
    this._subAtoms = new this._getBaseType()();
  }

  _validate(val) {
    if (val.constructor !== this._getBaseType()) {
      console.log(val);
      throw new Error("Expected an " + this._getBaseType().name);
    }
  }

  _sel(...scope) {
    let
      key = scope.shift(),
      sub = this._subAtoms[key];
    if (!sub) return undefined;
    return sub.sel(...scope);
  }

  _get() {
    let r = new this._getBaseType()();
    eachKV(this._subAtoms, (k, v) => r[k] = v._get());
    return r;
  }

  _set(val) {
    this._validate(val);
    let changed = false;
    eachKV(val, (k, v) => {
      if (this._subAtoms[k] === undefined) {
        this._subAtoms[k] = atom(v, this);
        this._subAtoms[k]._parent = this;
        changed = true;
      }
      else if (this._subAtoms[k]._set(v)) changed = true;
    });
    return changed;
  }
}

class ListAtom extends ListOrObjectAtom {
  _getBaseType() { return Array; }

  push(val) {
    this._subAtoms.push(atom(val));
    this._dep.changed();
  }

  pop(val) {
    if (this._subAtoms.length == 0) return undefined;
    this._dep.changed();
    return this._subAtoms.pop().get();
  }

  shift(val) {
    if (this._subAtoms.length == 0) return undefined;
    this._dep.changed();
    return this._subAtoms.shift().get();
  }

  unshift(val) {
    this._subAtoms.unshift(atom(val));
    this._dep.changed();
  }

  // TODO: drop, filter, insert
}

class ObjectAtom extends ListOrObjectAtom {
  _getBaseType() { return Object; }
}

// function atomFromKey(k) {
//   switch (k.constructor) {
//     case String:  return atom({});
//     case Number:  return atom([]);
//     default:
//       console.log(k);
//       throw "Unsupported atom key type.";
//   }
// }

function atom(v) {
  switch (v.constructor) {
    case Array:   return new ListAtom(v);
    case Object:  return new ObjectAtom(v);
    case String:
    case Number:  return new ValueAtom(v);
    default:
      console.log(v);
      throw new Error("Unsupported Atom type.");
  }
}

types.atom = atom;
