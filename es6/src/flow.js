class Flow {
  constructor(dom, parentFlow, index) {
    this.dom        = dom;
    this.children   = [];
    this.parentFlow = parentFlow;
    this.index      = index;
    this.toggle();
  }

  nextDom() {
    if (!this.parentFlow) return undefined;
    for (var i=this.index+1; i<this.parentFlow.children.length; i++) {
      let c = this.parentFlow.children[i];
      if (c.included && c.dom) return c;
    }
    if (!this.parentFlow || this.parentFlow.dom) return undefined;
    return this.parentFlow.nextDom();
  }

  toggle() {
    if (!this.dom) return;
    this.included = !this.included;
    if (!this.dom) throw("Cannot toggle node without dom");
    if (this.constructor == Root) return
      if (this.included)
        this.surroundingDom().insertBefore(this.dom, this.nextDom());
      else
        this.surroundingDom().removeChild(this.dom);
  }

  surroundingDom() {
    if (!this.parentFlow) return;
    return this.parentFlow.selfOrSurroundingDom();
  }

  selfOrSurroundingDom() {
    // if (!this.included)  throw("tried to remove from unincluded dom.");
    if (this.dom)        return this.dom;
    if (this.parentFlow) return this.parentFlow.selfOrSurroundingDom();
  }

  branch(dom) {
    let c = new Flow(dom, this, this.children.length);
    this.children.push(c);
    return c;
  }

  // TODO: trim; allow truncating the list to free memory.
}

class Root extends Flow { }

function flow(dom)         { return new Flow(dom); }
flow.root = function (dom) { return new Root(dom); }

module.exports = flow

