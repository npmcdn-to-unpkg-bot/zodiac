

class Flow {
  constructor(dom, parentFlow, index) {
    this.dom         = dom;
    this.children    = [];
    this.parentFlow  = parentFlow;
    this.index       = index;

    if (this.parentFlow) {
      this.parentFlow.children.push(this);

      if (this.parentFlow.dom) this.parentDomFlow = this.parentFlow
      else this.parentDomFlow = this.parentFlow.parentDomFlow;
    }

    if (this.dom) this.domChildren = [];

    if (this.parentDomFlow && this.dom) {
      this.parentDomIndex = this.parentDomFlow.domChildren.length;
      this.parentDomFlow.domChildren.push(this);
    }
  }

  nextDom() {
    this.parentDomFlow.children[this.parentDomIndex];
  }

  // Toggles dom of a particular node. This only wo
  toggle() {
    this.included = !this.included;
    if (!this.dom) throw("Cannot toggle node without dom");
    if (this.constructor == Root) return;
    // console.log("---");
    // console.log(this.parentDomFlow.dom); // TODO
    if (this.included)
      this.parentDomFlow.dom.insertBefore(this.dom, this.nextDom());
    else
      this.parentDomFlow.dom.removeChild(this.dom);
  }

  branch(dom) {
    let c = new Flow(dom, this, this.children.length);
    return c;
  }
}

class Root extends Flow { }

function flow(dom)         { return new Flow(dom); }
flow.root = function (dom) { return new Root(dom); }

module.exports = flow

