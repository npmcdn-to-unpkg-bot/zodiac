
// Various helpful utility functions that become available right
// on the Zodiac object.

// More convenient dom timer syntax. Uses a regular timer.
function ZIntervalTimer(interval, callback) {
  const timer = window.setInterval(callback, interval);
  stop = function() {
    window.clearInterval(timer)
  };
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