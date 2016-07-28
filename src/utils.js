
// Various helpful utility functions that become available right
// on the Zodiac object.

// More convenient dom timer syntax. Uses a regular timer.
function ZIntervalTimer(interval, callback) {
  const timer = window.setInterval(callback, interval);
  return {
    stop: function() { window.clearInterval(timer); }
  }
}

export function IntervalTimer(...args) {
  return new ZIntervalTimer(...args);
}

// Experimental: Wrap an event callback to receive the target value.
export function targetValue(fn) {
  return function (ev) {
    fn(ev.target.value)
  };
}

// Experimental: Wrap an event callback to only receive enter presses.
export function ifEnter(fn) {
  return function (ev) {
    if (ev.keyCode === 13)
      fn(ev);
  };
}

// adapted from underscore.js
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(wait, func, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (immediate && !timeout) func.apply(context, args);
  };
};


