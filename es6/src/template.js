
let tracker = require("./tracker");


function _is(obj, kind) {
  let toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

function tagify(obj) {
  if (typeof(obj) == "string")    return text(obj);
  if (_is(obj, "Array")) {
    if (obj.length != 1) throw("Wrong array length in template.");
    return text(obj[0]);
  }
  else return obj;
}

function text(str) {
  function render(parentFlow) {
    let comp, isReactive = typeof(str) == "function";

    function autorun() {
      if (isReactive)
        comp = tracker.autorun(function () {
          dom.nodeValue = str();
        });
    }
    let dom = isReactive ? document.createTextNode("") :
                           document.createTextNode(str);

    let leaf = parentFlow.branch(dom);

    function toggle() {
      if (!comp || comp.stopped) autorun()
      else if (isReactive)       comp.stop();
      leaf.toggle();
    }
    return {toggle};
  }
  return {render};
}

function html(...children) {
  let mounters = children.map(c => tagify(c));
  function render(parentFlow) {
    let togglers = mounters.map((m) => m.render(parentFlow));
    // console.log(togglers);
    function toggle() { for (var t of togglers) t.toggle(); }
    return { toggle };
  }

  return { render };
}

function tag(name, ...children) {
  "use strict";

  let attrs        = {};
  if (typeof(children[0]) == "object") attrs = children.shift();
  let childMounter = html(...children);

  function render(parentFlow) {
    let comps = [], dom = document.createElement(name);
    let branch = parentFlow.branch(dom);

    Object.keys(attrs).forEach(function (k) {
      if (_is(attrs[k], "Array")) { }
      else if (k[0] == "$" || k[0] == "_") {
        let name = k.slice(1);
        dom.addEventListener(name, attrs[k], k[0] == "$");
      }
      else dom.setAttribute(k, attrs[k]);
    });

    function autorun() {
      comps = [];
      Object.keys(attrs).forEach(function (k) {
        if (_is(attrs[k], "Array")) {
          comps.push(tracker.autorun(function () {
            let str = attrs[k].map(function (i) {
              return typeof(i) == "function" ? i() : i
            }).join("");
            dom.setAttribute(k, str);
          }));
        }
      });
    }
    let childToggler = childMounter.render(branch);

    function toggle() {
      if (comps.length > 0 && comps[0].stopped) autorun();
      else for (var c of comps) c.stop();
      branch.toggle();
      childToggler.toggle();
    }

    return {toggle};
  }
  return { render };
}

function cond(check, a, b) {
  a = tagify(a);
  if (b) b = tagify(b);

  function render (parentFlow) {

    let aToggler = a.render(parentFlow);
    let bToggler = b ? b.render(parentFlow) : undefined;

    let comp, state, aOn = false, bOn = false;

    function autorun() {
      comp = tracker.autorun(function () {
        state = !!check();
        if (     state != aOn) { aToggler.toggle(); aOn = !aOn; }
        if (b && state == bOn) { bToggler.toggle(); bOn = !bOn; }
      });
    }
    function toggle() {
      if (!comp || comp.stopped) autorun()
      else {
        comp.stop();
        if (state) aToggler.toggle();
        else if (b) bToggler.toggle();
      }
    }
    return {toggle};
  }
  return { render };
}

// html, head and body are not included.
let tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

module.exports = {html, tag, text, cond}

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
  // Yes, we actually need this to correctly bind t for each tag function.

