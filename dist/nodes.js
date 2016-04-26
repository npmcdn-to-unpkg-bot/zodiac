"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tracker = require("./tracker");

var NodeInstance = function () {
  function NodeInstance(nodeDefinition, parentNodeInstance) {
    _classCallCheck(this, NodeInstance);

    this.nodeDefinition = nodeDefinition;
    this.parentNodeInstance = parentNodeInstance;
    this.active = false;

    if (parentNodeInstance) this.domParent = parentNodeInstance.dom ? parentNodeInstance : parentNodeInstance.domParent;

    this.subConstructor(this);
  }

  _createClass(NodeInstance, [{
    key: "toggle",
    value: function toggle() {
      this.active ? this.deactivate() : this.activate();
    }
  }, {
    key: "activate",
    value: function activate() {
      if (this.active) throw "Already active.";
      this._activate();
      this.active = true;
    }
  }, {
    key: "deactivate",
    value: function deactivate() {
      if (!this.active) throw "Already inactive.";
      this._deactivate();
      this.active = false;
    }

    // Returns the next active dom sibling after the current one. By active dom, i mean dom that is currently included in the document. This is definitely the most difficult piece of code.

  }, {
    key: "nextDomSibling",
    value: function nextDomSibling() {
      var r = this.domParent.domChildAfter(this);
      if (r) return r.dom;
    }
  }, {
    key: "domChildAfter",
    value: function domChildAfter(target) {
      var state = arguments.length <= 1 || arguments[1] === undefined ? { passed: false } : arguments[1];

      if (!this.descendants) return;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.descendants()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var d = _step.value;

          // console.log(d);
          if (state.passed) {
            if (d.dom && d.active) {
              // console.log("found next in flow");
              return d;
            }
          } else if (d == target) {
            // console.log("found");
            state.passed = true;
          }
          if (d.constructor != TagNodeInstance) {
            // console.log("descending");
            var match = d.domChildAfter(target, state);
            if (match) return match;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);

  return NodeInstance;
}();

// Mounting

var Mounting = function (_NodeInstance) {
  _inherits(Mounting, _NodeInstance);

  function Mounting() {
    _classCallCheck(this, Mounting);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Mounting).apply(this, arguments));
  }

  _createClass(Mounting, [{
    key: "subConstructor",
    value: function subConstructor() {
      this.active = true;
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return [this.root];
    }
  }, {
    key: "toggle",
    value: function toggle() {
      this.root.toggle();
    }
  }, {
    key: "nextDomSibling",
    value: function nextDomSibling() {
      throw "A mounting does not have dom siblings.";
    }
  }]);

  return Mounting;
}(NodeInstance);

function mount(dom, root) {
  var m = new Mounting();
  m.dom = dom;
  m.root = root.render(m);
  return m;
}

// Text

var TextNode = function () {
  function TextNode(str) {
    _classCallCheck(this, TextNode);

    this.str = str;
    this.isReactive = typeof str == "function";
  }

  _createClass(TextNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new TextNodeInstance(this, parentNodeInstance);
    }
  }]);

  return TextNode;
}();

function text(str) {
  return new TextNode(str);
}

var TextNodeInstance = function (_NodeInstance2) {
  _inherits(TextNodeInstance, _NodeInstance2);

  function TextNodeInstance() {
    _classCallCheck(this, TextNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TextNodeInstance).apply(this, arguments));
  }

  _createClass(TextNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      this.dom = this.nodeDefinition.isReactive ? document.createTextNode("") : document.createTextNode(this.nodeDefinition.str);
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _this3 = this;

      if (this.nodeDefinition.isReactive) {
        this.computation = tracker.autorun(function () {
          _this3.dom.nodeValue = _this3.nodeDefinition.str();
        });
      }
      this.domParent.dom.insertBefore(this.dom, this.nextDomSibling());
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      if (this.nodeDefinition.isReactive) this.computation.stop();
      this.domParent.dom.removeChild(this.dom);
    }
  }]);

  return TextNodeInstance;
}(NodeInstance);

// Html

function _is(obj, kind) {
  var toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

function tagify(obj) {
  if (typeof obj == "string") return text(obj);
  if (typeof obj == "number") return text(obj);
  if (_is(obj, "Array")) {
    if (obj.length != 1) throw "Wrong array length in template.";
    return text(obj[0]);
  } else return obj;
}

var HtmlNode = function () {
  function HtmlNode(children) {
    _classCallCheck(this, HtmlNode);

    this.children = children.map(function (m) {
      return tagify(m);
    });
  }

  _createClass(HtmlNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new HtmlNodeInstance(this, parentNodeInstance);
    }
  }]);

  return HtmlNode;
}();

function html() {
  for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
    children[_key] = arguments[_key];
  }

  return new HtmlNode(children);
}

var HtmlNodeInstance = function (_NodeInstance3) {
  _inherits(HtmlNodeInstance, _NodeInstance3);

  function HtmlNodeInstance() {
    _classCallCheck(this, HtmlNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(HtmlNodeInstance).apply(this, arguments));
  }

  _createClass(HtmlNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      var _this5 = this;

      this.children = this.nodeDefinition.children.map(function (m) {
        return m.render(_this5);
      });
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var c = _step2.value;
          c.activate();
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var c = _step3.value;
          c.deactivate();
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return this.children;
    }
  }]);

  return HtmlNodeInstance;
}(NodeInstance);

var TagNode = function () {
  function TagNode(name, children) {
    _classCallCheck(this, TagNode);

    this.name = name;
    this.attrs = children[0] && children[0].constructor == Object ? children.shift() : {};
    this.html = html.apply(undefined, _toConsumableArray(children));
  }

  _createClass(TagNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new TagNodeInstance(this, parentNodeInstance);
    }
  }]);

  return TagNode;
}();

function tag(name) {
  for (var _len2 = arguments.length, children = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    children[_key2 - 1] = arguments[_key2];
  }

  return new TagNode(name, children);
}

var TagNodeInstance = function (_NodeInstance4) {
  _inherits(TagNodeInstance, _NodeInstance4);

  function TagNodeInstance() {
    _classCallCheck(this, TagNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TagNodeInstance).apply(this, arguments));
  }

  _createClass(TagNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      var _this7 = this;

      this.dom = document.createElement(this.nodeDefinition.name);
      this.html = this.nodeDefinition.html.render(this);

      this.eachDefinitionAttr(function (k, v) {
        if (!_is(v, "Array") && (k[0] == "$" || k[0] == "_")) {
          if (typeof v != "function") throw "Template event listener not a function.";
          _this7.dom.addEventListener(k.slice(1), v, k[0] == "$");
        } else _this7._setAttr(k, v);
      });
    }
  }, {
    key: "_setAttr",
    value: function _setAttr(k, v) {
      console.log(typeof v === "undefined" ? "undefined" : _typeof(v));
      console.log("---");
      if (v == false || v == undefined || v == null) this.dom.removeAttribute(k);else this.dom.setAttribute(k, v);
    }
  }, {
    key: "eachDefinitionAttr",
    value: function eachDefinitionAttr(fn) {
      var _this8 = this;

      Object.keys(this.nodeDefinition.attrs).forEach(function (k) {
        return fn(k, _this8.nodeDefinition.attrs[k]);
      });
    }
  }, {
    key: "_sendEvent",
    value: function _sendEvent(name) {
      var ev = document.createEvent('Event');
      ev.initEvent(name, false, true);
      this.dom.dispatchEvent(ev);
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _this9 = this;

      this.computations = [];
      this.eachDefinitionAttr(function (k, v) {
        if (_is(v, "Array")) _this9.computations.push(tracker.autorun(function () {
          var str = v.length > 1 ? v.map(function (s) {
            return typeof s == "function" ? s() : s;
          }).join("") : typeof v[0] == "function" ? v[0]() : v[0];
          _this9._setAttr(k, str);
        }));
      });

      this.html.activate();
      this.domParent.dom.insertBefore(this.dom, this.nextDomSibling());
      this._sendEvent("_activated");
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.computations[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var c = _step4.value;
          c.stop();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      this.domParent.dom.removeChild(this.dom);
      this.html.deactivate();
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return [this.html];
    }
  }]);

  return TagNodeInstance;
}(NodeInstance);

// Cond

var CondNode = function () {
  function CondNode(check, a, b) {
    _classCallCheck(this, CondNode);

    this.check = check;
    this.a = tagify(a);
    if (b) this.b = tagify(b);
  }

  _createClass(CondNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new CondNodeInstance(this, parentNodeInstance);
    }
  }]);

  return CondNode;
}();

function cond(check, a, b) {
  return new CondNode(check, a, b);
}

var CondNodeInstance = function (_NodeInstance5) {
  _inherits(CondNodeInstance, _NodeInstance5);

  function CondNodeInstance() {
    _classCallCheck(this, CondNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(CondNodeInstance).apply(this, arguments));
  }

  _createClass(CondNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      this.a = this.nodeDefinition.a.render(this);
      if (this.nodeDefinition.b) this.b = this.nodeDefinition.b.render(this);
    }
  }, {
    key: "checkState",
    value: function checkState() {
      var chk = this.nodeDefinition.check;
      return !!(typeof chk == "function" ? chk() : chk);
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _this11 = this;

      this.computation = tracker.autorun(function () {
        _this11.state = _this11.checkState();
        if (_this11.state != _this11.a.active) _this11.a.toggle();
        if (_this11.b && _this11.state == _this11.b.active) _this11.b.toggle();
      });
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      this.computation.stop();
      if (this.a.active) this.a.deactivate();
      if (this.b && this.b.active) this.b.deactivate();
    }
  }, {
    key: "descendants",
    value: function descendants() {
      var r = [this.a];
      if (this.b) r.push(this.b);
      return r;
    }
  }]);

  return CondNodeInstance;
}(NodeInstance);

// TODO: rename HtmlNode etc.

// Loop

var LoopNode = function () {
  function LoopNode(listSource, body) {
    _classCallCheck(this, LoopNode);

    this.isReactive = typeof listSource == "function";
    this.listSource = listSource;
    this.body = body;
  }

  _createClass(LoopNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new LoopNodeInstance(this, parentNodeInstance);
    }
  }]);

  return LoopNode;
}();

function loop(listSource, body) {
  return new LoopNode(listSource, body);
}

var LoopNodeInstance = function (_NodeInstance6) {
  _inherits(LoopNodeInstance, _NodeInstance6);

  function LoopNodeInstance() {
    _classCallCheck(this, LoopNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(LoopNodeInstance).apply(this, arguments));
  }

  _createClass(LoopNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      var _this13 = this;

      var ndf = this.nodeDefinition;
      if (!ndf.isReactive) {
        this.bodyInstances = ndf.listSource.map(function (m) {
          return ndf.body(m).render(_this13);
        });
      }
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _this14 = this;

      var ndf = this.nodeDefinition;
      if (ndf.isReactive) {
        this.computation = tracker.autorun(function () {
          if (_this14.active) {
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
              for (var _iterator5 = _this14.bodyInstances[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var c = _step5.value;
                c.deactivate();
              }
            } catch (err) {
              _didIteratorError5 = true;
              _iteratorError5 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                  _iterator5.return();
                }
              } finally {
                if (_didIteratorError5) {
                  throw _iteratorError5;
                }
              }
            }
          }_this14.bodyInstances = ndf.listSource().map(function (m) {
            return ndf.body(m).render(_this14);
          });
          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = _this14.bodyInstances[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              var c = _step6.value;
              c.activate();
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6.return) {
                _iterator6.return();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        });
      } else {
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = this.bodyInstances[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var b = _step7.value;
            b.activate();
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }
      }
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      if (this.computation) this.computation.stop();
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this.bodyInstances[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var b = _step8.value;
          b.deactivate();
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8.return) {
            _iterator8.return();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return this.bodyInstances || [];
    }
  }]);

  return LoopNodeInstance;
}(NodeInstance);

// Dynamic

var DynamicNode = function () {
  function DynamicNode(condition, branches) {
    _classCallCheck(this, DynamicNode);

    this.condition = condition;
    this.branches = branches;
    this.isReactive = typeof condition == "function";
  }

  _createClass(DynamicNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new DynamicNodeInstance(this, parentNodeInstance);
    }
  }]);

  return DynamicNode;
}();

function dynamic(condition, branches) {
  return new DynamicNode(condition, branches);
}

var DynamicNodeInstance = function (_NodeInstance7) {
  _inherits(DynamicNodeInstance, _NodeInstance7);

  function DynamicNodeInstance() {
    _classCallCheck(this, DynamicNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(DynamicNodeInstance).apply(this, arguments));
  }

  _createClass(DynamicNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      var _this16 = this;

      this.branches = {};
      this.children = [];
      var ndf = this.nodeDefinition;
      Object.keys(ndf.branches).forEach(function (k) {
        _this16.branches[k] = ndf.branches[k].render(_this16);
        _this16.children.push(_this16.branches[k]);
      });
      if (!ndf.isReactive) this.state = ndf.condition;
    }
  }, {
    key: "_activateState",
    value: function _activateState() {
      if (!this.branches[this.state]) {
        console.log(this);
        throw "Unknown dynamic switch state.";
      }
      this.branches[this.state].activate();
    }
  }, {
    key: "_activate",
    value: function _activate() {
      var _this17 = this;

      var ndf = this.nodeDefinition;
      if (ndf.isReactive) {
        this.computation = tracker.autorun(function () {
          var newState = ndf.condition();
          if (newState == _this17.state) return;
          _this17.state = newState;
          _this17._activateState();
        });
      } else this._activateState();
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      if (this.isReactive) this.computation.stop();
      var branch = this.branches[this.state];
      if (branch) branch.deactivate();
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return this.children;
    }
  }]);

  return DynamicNodeInstance;
}(NodeInstance);

// Component

var ComponentNode = function () {
  function ComponentNode() {
    var props = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, ComponentNode);

    this.onShow = props.onShow;
    this.onHide = props.onHide;
    this.template = tagify(props.template);
  }

  _createClass(ComponentNode, [{
    key: "render",
    value: function render(parentNodeInstance) {
      return new ComponentNodeInstance(this, parentNodeInstance);
    }
  }]);

  return ComponentNode;
}();

function component(props) {
  return new ComponentNode(props);
}

var ComponentNodeInstance = function (_NodeInstance8) {
  _inherits(ComponentNodeInstance, _NodeInstance8);

  function ComponentNodeInstance() {
    _classCallCheck(this, ComponentNodeInstance);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ComponentNodeInstance).apply(this, arguments));
  }

  _createClass(ComponentNodeInstance, [{
    key: "subConstructor",
    value: function subConstructor() {
      this.template = this.nodeDefinition.template.render(this);
    }
  }, {
    key: "_activate",
    value: function _activate() {
      this.template.activate();
      if (this.nodeDefinition.onShow) this.nodeDefinition.onShow(this);
    }
  }, {
    key: "_deactivate",
    value: function _deactivate() {
      if (this.nodeDefinition.onHide) this.nodeDefinition.onHide(this);
      this.template.deactivate();
    }
  }, {
    key: "descendants",
    value: function descendants() {
      return [this.template];
    }
  }]);

  return ComponentNodeInstance;
}(NodeInstance);

// TODO: tests.

module.exports = {
  mount: mount, text: text, html: html, tag: tag, cond: cond, loop: loop, dynamic: dynamic, component: component
};

// html, head and body are not included.
var tags = 'a abbr address article aside audio b bdi bdo blockquote button canvas caption cite code colgroup datalist dd del details dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend li map mark menu meter nav noscript object ol optgroup option output p pre progress q rp rt ruby s samp script section select small span strong style sub summary sup table tbody td textarea tfoot th thead time title tr u ul video applet acronym bgsound dir frameset noframes isindex area base br col command embed hr img input keygen link meta param source track wbr basefont frame applet acronym bgsound dir frameset noframes isindex listing nextid noembed plaintext rb strike xmp big blink center font marquee multicol nobr spacer tt basefont frame'.split(" ");

var _iteratorNormalCompletion9 = true;
var _didIteratorError9 = false;
var _iteratorError9 = undefined;

try {
  for (var _iterator9 = tags[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
    var t = _step9.value;

    module.exports[t] = function (t) {
      return function () {
        return tag.apply(undefined, [t].concat(Array.prototype.slice.call(arguments)));
      };
    }(t);
  }
} catch (err) {
  _didIteratorError9 = true;
  _iteratorError9 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion9 && _iterator9.return) {
      _iterator9.return();
    }
  } finally {
    if (_didIteratorError9) {
      throw _iteratorError9;
    }
  }
}