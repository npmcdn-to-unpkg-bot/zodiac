
Node   = require "../src/zodiac/render/node"

describe "Node", ->
  beforeEach ->
    @p = new Node
    @a = @p.createChild()
    @b = @p.createChild()
    @c = @p.createChild()

  describe "#createChild", ->
    it "adds children", -> @p.children.length.should.eql 3

    it "makes the children point back and forth", ->
      @p.children[0].next.should.equal @p.children[1]
      @p.children[1].next.should.equal @p.children[2]
      @p.children[1].prev.should.equal @p.children[0]
      @p.children[2].prev.should.equal @p.children[1]

    it "points to undefined values at the ends", ->
      (@p.children[0].prev == undefined).should.be.true()
      (@p.children[2].next == undefined).should.be.true()

  describe "#dropChildren", ->
    it "removes all children", ->
      @p.dropChildren()
      @p.children.length.should.eql 0

    it "removes node references", ->
      @p.dropChildren()
      (@a.next == undefined).should.be.true()
      (@b.next == undefined).should.be.true()
      (@c.prev == undefined).should.be.true()
      (@b.prev == undefined).should.be.true()

  describe "#drop", ->
    n = new Node "parent", "prev"
    n.drop()
    (n.prev   == undefined).should.be.true()
    (n.next   == undefined).should.be.true()
    (n.parent == undefined).should.be.true()

  describe "#trimChildren", ->
    it "removes last child", ->
      @p.trimChildren(2)
      @p.children[0].should.equal @a
      @p.children[1].should.equal @b
      (@p.children[2] == undefined).should.be.true()

    it "removes the reference to the trimmed child", ->
      @p.trimChildren(2)
      (@p.children[1].next == undefined).should.be.true()

  describe "#domContainer", ->
    it "throws when there is no dom parent"
    it "does not return itself if it is a dom node"
    it "returns its immediate parent"
    it "returns its distant parent"

  describe "#nextDom", ->
    describe "on the first node within a parent"
    describe "on the last node within a parent"
    describe "on a middle node within a parent"

  describe "#renderDom", ->
    describe "on Node first in parent flow"
    describe "on Node last in parent flow"
    describe "on Node in complex flow"


