
let tracker = require("./tracker");

// All the dom-producing functions, like text, tag, html, and h2, have a create-mount-destroy which always happens in that order, and only once per instance. The creator is a function returning a mounter, and the mounter is a function returning a destructor. The creator can take any number of parameters, depending of the kind of dom it produces. The mounter always takes one or two parameters; the parent dom node, and an optional dom node within the parent to insert itself before. The destructor never takes any parameters. As you can see, this lifecycle is expressed in terms of nested closures inside the outer constructor function. Beautiful!

function text(str) {
  if (typeof(str) == "function") {
    var dom = document.createTextNode("hello");
    var comp = tracker.autorun(function () {
      dom.nodeValue = str();
    });
  }
  else {
    var dom = document.createTextNode(str);
  }

  return function (mount, pos) {
    mount.insertBefore(dom, pos);
    return function () {
      if (typeof(str) == "function") comp.stop();
      mount.removeChild(dom);
    }
  }
}

function _is(obj, kind) {
  let toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

function tagify(obj) {
  if (typeof(obj) == "string")    return text(obj);
  if (typeof(obj) == "function")  return obj;
  if (_is(obj, "Array")) {
    if (obj.length != 1) throw("Wrong array length in template.");
    return text(obj[0]);
  }
  throw("Invalid data in template (logged to console).");
}

function html(...children) {
  // list of tagified children
  let mounters = children.map(c => tagify(c));

  return function (mount, pos) {
    let destructors = mounters.map((m) => m(mount, pos));

    return function () { // destroy
      comp.stop();
      mount.removeChild(dom);
      for (var d of destructors) d()
    }
  }
}

function tag(name, ...children) {
  "use strict";

  let attrs = {};
  if (typeof(children[0]) == "object") attrs = children.shift();

  let dom             = document.createElement(name);
  let childMounter    = html(...children);
  let childDestructor = childMounter(dom);
  let comps           = [];

  Object.keys(attrs).forEach(function (k) {
    let v = attrs[k];

    if (_is(v, "Array")) {
      comps.push(tracker.autorun(function () {
        let str = v.map(i => typeof(i) == "function" ? i() : i).join("");
        dom.setAttribute(k, str);
      }));
    }
    else dom.setAttribute(k, v);
  });

  return function (mount, pos) {
    mount.insertBefore(dom, pos);

    return function () { // destroy
      for (var c of comps) c.stop();
      mount.removeChild(dom);
      childDestructor();
    }
  }
}

let tags = 'a abbr address article aside audio b bdi bdo blockquote body button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup html i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

module.exports = {html, tag, text}

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
  // Yo bro i put a closure in ur closure so you u get closure.
  // Yes, we actually need this to correctly bind t for each tag function.

