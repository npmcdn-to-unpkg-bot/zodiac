
// templates.js
//
// This file contains the reactive DOM implementation that is the core of Zodiac. It is the most complicated part, and I hope i will get around to writing some sort of explanation once it is 100%-ish finished.

const tracker = require("./tracker");

class NodeInstance {

  constructor(nodeDefinition, parentNodeInstance) {
    this.nodeDefinition = nodeDefinition;
    this.parentNodeInstance = parentNodeInstance;
    this.active = false;

    if (parentNodeInstance)
      this.domParent = parentNodeInstance.dom
        ? parentNodeInstance
        : parentNodeInstance.domParent;

    this.subConstructor(this);
  }

  toggle() {
    this.active ? this.deactivate() : this.activate();
  }

  activate() {
    if (this.active) throw("Already active.");
    this._activate();
    this.active = true;
  }

  deactivate() {
    if (!this.active) throw("Already inactive.");
    this._deactivate();
    this.active = false;
  }

  // Returns the next active dom sibling after the current one. By active dom, i mean dom that is currently included in the document.
  nextDomSibling() {
    let r = this.domParent.domChildAfter(this);
    if (r) return r.dom;
  }

  domChildAfter(target, state = {passed: false}) {
    if (!this.descendants) return;
    for (var d of this.descendants()) {
      // console.log(d);
      if (state.passed) {
        if (d.dom && d.active) {
          // console.log("found next in flow");
          return d;
        }
      }
      else if (d == target) {
        // console.log("found");
        state.passed = true;
      }
      if (d.constructor != TagNodeInstance) {
        // console.log("descending");
        let match = d.domChildAfter(target, state);
        if (match) return match;
      }
    }
  }
}

// Mounting

class Mounting extends NodeInstance {

  subConstructor() {
    this.active = true;
  }

  descendants() {
    return [this.root];
  }

  toggle() { this.root.toggle(); }

  nextDomSibling() { throw("A mounting does not have dom siblings."); }
}

function mount(dom, root) {
  var m = new Mounting();
  m.dom = dom;
  m.root = root.render(m);
  m.toggle();
  return m;
}

// Text

class TextNode {

  constructor(str) {
    this.str = str;
    this.isReactive = typeof(str) == "function";
  }

  render(parentNodeInstance) {
    return new TextNodeInstance(this, parentNodeInstance);
  }
}

function text(str) {
  return new TextNode(str);
}

class TextNodeInstance extends NodeInstance {

  subConstructor() {
    this.dom = this.nodeDefinition.isReactive
      ? document.createTextNode("")
      : document.createTextNode(this.nodeDefinition.str);
  }

  _activate() {
    if (this.nodeDefinition.isReactive) {
      this.computation = tracker.autorun(() => {
        this.dom.nodeValue = this.nodeDefinition.str();
      });
    }
    this.domParent.dom.insertBefore(this.dom, this.nextDomSibling());
  }

  _deactivate() {
    if (this.nodeDefinition.isReactive) this.computation.stop();
    this.domParent.dom.removeChild(this.dom);
  }
}

function _is(obj, kind) {
  let toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

function tagify(obj) {
  switch (typeof obj) {
    case "string":
    case "number":
    case "function":
      return text(obj);
    default:
  }

  // Experimental: Array syntax
  if (_is(obj, "Array"))
    return list(...obj.map(item => tagify(item)));

  else return obj;
}

// List
// This is exported as dom(...) in the official api.
// It is called List here, because DomNode would be
// wrong and confusing in this context.

class ListNode {

  constructor(children) {
    this.children = children.map(m => tagify(m));
  }

  render(parentNodeInstance) {
    return new ListNodeInstance(this, parentNodeInstance);
  }
}

function list(...children) {
  return new ListNode(children);
}

class ListNodeInstance extends NodeInstance {

  subConstructor() {
    this.children = this.nodeDefinition.children.map((m) => {
      return m.render(this);
    });
  }

  _activate()   { for (var c of this.children) c.activate(); }
  _deactivate() { for (var c of this.children) c.deactivate(); }

  descendants() { return this.children; }
}

class TagNode {

  constructor(name, children) {
    this.name = name;
    this.attrs = children[0] && children[0].constructor == Object
      ? children.shift()
      : {};
    this.html = list(...children);
  }

  render(parentNodeInstance) {
    return new TagNodeInstance(this, parentNodeInstance);
  }
}

function tag(name, ...children) {
  return new TagNode(name, children);
}

function checkAttr(k, v) {
  if (k[0] == "$" || k[0] == "_") {
    if (typeof(v) == "function") return "event"
    else {
      console.log(v);
      throw("Template event listener not a function: " + k)
    }
  }
  if (typeof v == "function") return "reactive";
  if (_is(v, "Array")) return "reactive";
  return "static";
}

function reactiveAttrGetter(v) {
  if (typeof(v) == "function") return v;
  if (_is(v, "Array")) return () =>
    v.map((item) =>
      (typeof(item) == "function") ? item() : item
    ).join("");
  return v;
}

class TagNodeInstance extends NodeInstance {

  subConstructor() {
    this.dom = document.createElement(this.nodeDefinition.name);
    this.html = this.nodeDefinition.html.render(this);

    this._eachDefinitionAttr((k, v, kind) => {
      switch (kind) {
        case "event":
          this.dom.addEventListener(
            k.slice(1), (e) => v(e), k[0] == "$");
          break;
        case "static":
          this._setAttr(k, v);
      }
    });
  }

  _setAttr(k, v) {
    if(v === false || v === undefined || v === null)
      this.dom.removeAttribute(k)
    else
      this.dom.setAttribute(k, v);
  }

  _eachDefinitionAttr(fn) {
    Object.keys(this.nodeDefinition.attrs).forEach((k) => {
      const v = this.nodeDefinition.attrs[k];
      fn(k, v, checkAttr(k, v));
    });
  }

  _sendEvent(name) {
    var ev = document.createEvent('Event');
    ev.initEvent(name, false, true);
    this.dom.dispatchEvent(ev);
  }

  _activate() {
    this.computations = [];
    this._eachDefinitionAttr((k, v, kind) => {
      if (kind === "reactive") {
        const getter = reactiveAttrGetter(v);
        this.computations.push(
          tracker.autorun(() =>
            this._setAttr(k, getter())));
      }
    });

    this.html.activate();
    this.domParent.dom.insertBefore(this.dom, this.nextDomSibling());
    this._sendEvent("_activated");
  }

  _deactivate() {
    for (var c of this.computations) c.stop();
    this.domParent.dom.removeChild(this.dom);
    this.html.deactivate();
  }

  descendants() { return [this.html]; }
}

// Cond

class CondNode {

  constructor(check, a, b) {
    this.check = check;
    this.a = tagify(a);
    if (b) this.b = tagify(b);
  }

  render(parentNodeInstance) {
    return new CondNodeInstance(this, parentNodeInstance);
  }
}

function cond(check, a, b) {
  return new CondNode(check, a, b);
}

class CondNodeInstance extends NodeInstance {

  subConstructor() {
    this.a = this.nodeDefinition.a.render(this);
    if (this.nodeDefinition.b)
      this.b = this.nodeDefinition.b.render(this);
  }

  checkState() {
    let chk = this.nodeDefinition.check;
    return !!(typeof(chk) == "function" ? chk() : chk)
  }

  _activate() {
    this.computation = tracker.autorun(() => {
      this.state = this.checkState();
      if (this.state != this.a.active) this.a.toggle();
      if (this.b && this.state == this.b.active) this.b.toggle();
    });
  }
  _deactivate() {
    this.computation.stop();
    if (this.a.active) this.a.deactivate();
    if (this.b && this.b.active) this.b.deactivate();
  }

  descendants() {
    let r = [this.a];
    if (this.b) r.push(this.b);
    return r;
  }
}

function _castArray() {
  if (!arguments.length) return [];
  var value = arguments[0];
  return _is(value, "Array") ? value : [value];
}

// Dynamic

class DynamicNode {

  constructor(listSource, remapFunc) {
    this.isReactive = typeof(listSource) == "function";
    this.listSource = listSource;
    this.remapFunc = remapFunc || (v => v);
    if (typeof(this.remapFunc) != "function")
      throw new Error("second argument for dynamic must be a function if present");
  }

  render(parentNodeInstance) {
    return new DynamicNodeInstance(this, parentNodeInstance);
  }

  _source() {
    const ls = this.listSource;
    return _castArray(typeof(ls) == "function" ? ls() : ls);
  }

  _mapBody(instance) {
    let i = 0;
    return this._source().map((m) =>
      tagify(this.remapFunc(m, i++)).render(instance)
    );
  }
}

function dynamic(listSource, remapFunc) {
  return new DynamicNode(listSource, remapFunc);
}

class DynamicNodeInstance extends NodeInstance {

  subConstructor() {
    let ndf = this.nodeDefinition;
    if (!ndf.isReactive)
      this.bodyInstances = ndf._mapBody(this);
  }

  _activate() {
    let ndf = this.nodeDefinition;
    if (ndf.isReactive) {
      // TODO: cut & update implementation
      this.computation = tracker.autorun(() => {
        if (this.active)
          for (var c of this.bodyInstances) c.deactivate();
        this.bodyInstances = ndf._mapBody(this);
        for (var c of this.bodyInstances) c.activate();
      });
    }
    else
      for (var b of this.bodyInstances) b.activate();
  }

  _deactivate() {
    if (this.computation) this.computation.stop();
    for (var b of this.bodyInstances) b.deactivate();
  }

  descendants() {
    return this.bodyInstances || [];
  }
}


// Component (experimental feature)

class ComponentNode {

  constructor(props = {}) {
    this.onShow = props.onShow;
    this.onHide = props.onHide;
    this.template = tagify(props.template);
  }

  render(parentNodeInstance) {
    return new ComponentNodeInstance(this, parentNodeInstance);
  }
}

function component(props) {
  return new ComponentNode(props);
}

class ComponentNodeInstance extends NodeInstance {

  subConstructor() {
    this.template = this.nodeDefinition.template.render(this);
  }

  _activate() {
    this.template.activate();
    if (this.nodeDefinition.onShow) this.nodeDefinition.onShow(this);
  }

  _deactivate() {
    if (this.nodeDefinition.onHide) this.nodeDefinition.onHide(this);
    this.template.deactivate();
  }

  descendants() { return [this.template]; }
}

module.exports = {
  mount, text, tag, cond, dynamic, component,
  dom: list
};

// html, head and body are not included.
const tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
