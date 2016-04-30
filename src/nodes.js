
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

// List

function _is(obj, kind) {
  let toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

function tagify(obj) {
  if (typeof(obj) == "string")    return text(obj);
  if (typeof(obj) == "number")    return text(obj);
  if (_is(obj, "Array")) {
    if (obj.length != 1) throw("Wrong array length in template.");
    return text(obj[0]);
  }
  else return obj;
}

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

class TagNodeInstance extends NodeInstance {

  subConstructor() {
    this.dom = document.createElement(this.nodeDefinition.name);
    this.html = this.nodeDefinition.html.render(this);

    this._eachDefinitionAttr((k, v) => {
      if (!_is(v, "Array") && (k[0] == "$" || k[0] == "_")){
        if (typeof(v) != "function")
          throw("Template event listener not a function.");
        this.dom.addEventListener(k.slice(1), v, k[0] == "$");
      }
      else
        this._setAttr(k, v);
    });
  }

  _setAttr(k, v) {
    if(v == false || v == undefined || v == null)
      this.dom.removeAttribute(k)
    else
      this.dom.setAttribute(k, v);
  }

  _eachDefinitionAttr(fn) {
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
    this._eachDefinitionAttr((k, v) => {
      if (_is(v, "Array"))
        this.computations.push(tracker.autorun(() => {
          let str = v.length > 1
            ? v.map(function (s) {
                return typeof(s) == "function" ? s() : s
              }).join("")
            : typeof(v[0]) == "function" ? v[0]() : v[0];
          this._setAttr(k, str);
        }));
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


// Loop

class LoopNode {

  constructor(listSource, body) {
    this.isReactive = typeof(listSource) == "function";
    this.listSource = listSource;
    this.body = body;
  }

  render(parentNodeInstance) {
    return new LoopNodeInstance(this, parentNodeInstance);
  }
}

function loop(listSource, body) {
  return new LoopNode(listSource, body);
}

class LoopNodeInstance extends NodeInstance {

  subConstructor() {
    let ndf = this.nodeDefinition;
    if (!ndf.isReactive) {
      this.bodyInstances = ndf.listSource.map((m) => {
        return ndf.body(() =>m).render(this);
      });
    }
  }

  _activate() {
    let ndf = this.nodeDefinition;
    if (ndf.isReactive) {
      this.computation = tracker.autorun(() => {
        if (this.active)
          for (var c of this.bodyInstances) c.deactivate();
        this.bodyInstances = ndf.listSource().map((m) => {
          return ndf.body(() => m).render(this);
        });
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

// Dynamic

class DynamicNode {

  constructor(condition, branches) {
    this.condition = condition;
    this.branches = branches;
    this.isReactive = typeof(condition) == "function";
  }

  render(parentNodeInstance) {
    return new DynamicNodeInstance(this, parentNodeInstance);
  }
}

function dynamic(condition, branches) {
  return new DynamicNode(condition, branches);
}

class DynamicNodeInstance extends NodeInstance {

  subConstructor() {
    this.branches = {};
    this.children = [];
    let ndf = this.nodeDefinition;
    Object.keys(ndf.branches).forEach((k) => {
      this.branches[k] = ndf.branches[k].render(this);
      this.children.push(this.branches[k]);
    });
    if (!ndf.isReactive)
      this.state = ndf.condition;
  }

  _activateState() {
    if (!this.branches[this.state]) {
      console.log(this);
      throw("Unknown dynamic switch state.");
    }
    this.branches[this.state].activate();
  }

  _activate() {
    let ndf = this.nodeDefinition;
    if (ndf.isReactive) {
      this.computation = tracker.autorun(() => {
        let newState = ndf.condition();
        if (newState == this.state) return;
        this.state = newState;
        this._activateState();
      });
    }
    else 
      this._activateState();
  }

  _deactivate() {
    if (this.isReactive) this.computation.stop();
    let branch = this.branches[this.state];
    if (branch) branch.deactivate();
  }

  descendants() { return this.children; }
}


// Component

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



// TODO: tests.

module.exports = {
  mount, text, tag, cond, loop, dynamic, component,
  dom: list
}

// html, head and body are not included.
const tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

for (var t of tags)
  module.exports[t] =
    (function (t) {
      return function () { return tag(t, ...arguments) };
    })(t);
