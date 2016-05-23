
const {Dep, autorun} = require("./tracker");

// variables.js
//
// Reactive variable implmentations based on Tracker,
// and some JavaScript helpers.
//
// We avoid `this` altogether here, in order to be able to pass
// all the methods freely around. This is important in order to
// avoid template boilerplate.


function shortcut(kind) {
  return function(...args) {
    return new kind(...args);
  }
}

export const
  $    = shortcut(ZVar),
  Dict = shortcut(ZDict);

// Return a reactive variable, which tracks changes using tracker,
// so that it functions as a reactive source.
function ZVar(value) {
  const 
    dep = Dep(),
    defaultValue = value;

  // Return the current value of the variable
  function get() {
    dep.depend();
    return value;
  }

  // Set the current value of the variable
  function set(val) {
    if (value === val) return;
    value = val;
    dep.changed();
  }

  // Depend reactively on this variable inside tracker.autorun.
  function depend() { dep.depend(); }

  // Reset this variable to the value that was initially
  // passed to the constructor.
  function reset()  { set(defaultValue); }

  // Boolean convenience method.
  function toggle() { set(!value); }

  // Integer convenience method.
  function inc() {
    dep.changed();
    return ++value;
  }

  // Integer convenience method.
  function dec() {
    dep.changed();
    return --value;
  }

  // Array convenience method.
  function push(val) {
    dep.changed();
    value.push(val);
  }

  // Array convenience method.
  function pop(val) {
    if (value.length > 0) dep.changed();
    return value.pop();
  }

  // Array convenience method.
  function unshift(val) {
    dep.changed();
    value.unshift(val);
  }

  // Array convenience method.
  function shift(val) {
    if (value.length > 0) dep.changed();
    return value.shift();
  }

  // Array convenience method
  function length() {
    dep.depend();
    return value.length;
  }

  // Array convenience method
  function filter(fn) {
    value = value.filter(fn);
    dep.changed();
  }

  // Array convenience method
  function drop(item) {
    filter(e => e !== item);
  }

  // Reset this variable, and return the value that was overwritten.
  function consume() {
    const result = value;
    reset();
    return result;
  }

  Object.assign(this, {
    set, depend, get,
    reset, consume,
    toggle,
    inc, dec,
    push, pop, unshift, shift, length, filter, drop
  });
}

// Reactive dictionary. Experimental feature.
function ZDict(_vals) {
  const
    deps = {},
    vals = {..._vals};

  function set(name, val) {
    if (vals[name] === val) return;
    deps[name] = deps[name] || Dep();
    deps[name].changed();
    vals[name] = val;
  }

  function get(name) {
    deps[name] = deps[name] || Dep();
    deps[name].depend();
    return vals[name];
  }
  Object.assign(this, {
    set, get
  });
}

// Returns a reactive variable that will change to the value of a reactive getter whenever the getter changes. It can however be set to other values inbetween, without affecting the source of the getter.
export function Follow(getter) {
  const result = $(1);
  autorun(() => result.set(getter()));
  return result;
}
