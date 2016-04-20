
let tracker = require("./tracker");

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

  // the flow is the theoretical order that the child dom nodes would have if they were all active at once. Only tag nodes and mountings have flow, and only tag and text nodes can be part of the flow.
  _setupFlow() {
    if (this.dom) {
      this.flowIndex = this.domParent.flow.length;
      this.domParent.flow.push(this);
    }
    if (this.descendants)
      for (var d of this.descendants()) d._setupFlow();
  }

  // Returns the next active dom sibling after the current one. By active dom, i mean dom that is currently included in the document.
  nextDomSibling() {
    for (var i=this.flowIndex; i<this.domParent.flow.length; i++) {
      let flow = this.domParent.flow[i];
      if (flow && flow.active) return flow.dom;
    }
  }
}

// Mounting

class Mounting extends NodeInstance {

  subConstructor() {
    this.active = true;
    this.flow = [];
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
  m.root._setupFlow();
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

// Html

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

class HtmlNode {

  constructor(children) {
    this.children = children.map(m => tagify(m));
  }

  render(parentNodeInstance) {
    return new HtmlNodeInstance(this, parentNodeInstance);
  }
}

function html(...children) {
  return new HtmlNode(children);
}

class HtmlNodeInstance extends NodeInstance {

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
    this.html = html(...children);
  }

  render(parentNodeInstance) {
    return new TagNodeInstance(this, parentNodeInstance);
  }
}

function tag(name, ...children) {
  return new TagNode(name, children);
}

class TagNodeInstance extends NodeInstance {

  subConstructor() {
    this.dom = document.createElement(this.nodeDefinition.name);
    this.html = this.nodeDefinition.html.render(this);
    this.flow = [];

    this.eachDefinitionAttr((k, v) => {
      if (!_is(v, "Array") && (k[0] == "$" || k[0] == "_")){
        if (typeof(v) != "function")
          throw("Template event listener not a function.");
        this.dom.addEventListener(k.slice(1), v, k[0] == "$");
      }
      else
        this.dom.setAttribute(k, v);
    });
  }

  eachDefinitionAttr(fn) {
    Object.keys(this.nodeDefinition.attrs).forEach((k) =>
      fn(k, this.nodeDefinition.attrs[k]));
  }

  _sendEvent(name) {
    var ev = document.createEvent('Event');
    ev.initEvent(name, false, true);
    this.dom.dispatchEvent(ev);
  }

  _activate() {
    this.computations = [];
    this.eachDefinitionAttr((k, v) => {
      if (_is(v, "Array"))
        this.computations.push(tracker.autorun(() => {
          let str = v.map(function (s) {
            return typeof(s) == "function" ? s() : s
          }).join("");
          this.dom.setAttribute(k, str);
        }));
    });

    this.html.activate();
    this.domParent.dom.insertBefore(this.dom, this.nextDomSibling());
    this._sendEvent("_activated");
  }

  _deactivate() {
    this._sendEvent("_deactivating");
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

  _activate() {
    this.computation = tracker.autorun(() => {
      this.state = !!this.nodeDefinition.check();
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

// TODO:
// loop, tests.

module.exports = {
  mount, text, html, tag, cond, NodeInstance //, loop
}

// html, head and body are not included.
let tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
