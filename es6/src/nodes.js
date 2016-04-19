
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

  nextDomSibling() {
    if (this.domParent) return this.domParent.domChildAfter(this);
  }

  domChildAfter(target, state = {passed: false}) {
    if (!this.active) return null;
    if (state.passed && this.dom) return this;
    if (this == target) state.passed = true;
    if (this.activeDescendants && !this.dom)
      for (var d of this.activeDescendants()) {
        let match = d.domChildAfter(target, state);
        if (match) return match;
      }
  }
}

// Mounting

class Mounting extends NodeInstance {

  subConstructor() {}

  _activate() {
    throw(
      "You cannot activate a mounting. Activate the root instead.");
  }

  _deactivate() {
    throw(
      "You cannot deactivate a mounting. Deactivate the root instead.");
  }

  nextDomSibling() { throw("A mounting does not have dom siblings."); }
}

function mount(dom) {
  var r = new Mounting();
  r.dom = dom;
  return r;
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

  activeDescendants() { return this.children; }
}

class TagNode {

  constructor(name, children) {
    this.name = name;
    this.attrs = children[0].constructor == Object
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

    this.eachDefinitionAttr((k, v) => {
      if (!_is(v, "Array") && (k[0] == "$" || k[0] == "_"))
        this.dom.addEventListener(k.slice(1), v, k[0] == "$")
      else
        this.dom.setAttribute(k, v);
    });
  }

  eachDefinitionAttr(fn) {
    Object.keys(this.nodeDefinition.attrs).forEach((k) =>
      fn(k, this.nodeDefinition.attrs[k]));
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
  }

  _deactivate() {
    for (var c of this.computations) c.stop();
    this.domParent.dom.removeChild(this.dom);
    this.html.deactivate();
  }

  activeDescendants() { return [this.html]; }
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

  activeDescendants() {
    r = [];
    if (this.a.active) r.push(this.a);
    if (this.b && this.b.active) r.push(this.b);
    return r;
  }
}

// TODO:
// loop, tests.

module.exports = {
  mount, text, html, tag, cond //, loop
}

// html, head and body are not included.
let tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
