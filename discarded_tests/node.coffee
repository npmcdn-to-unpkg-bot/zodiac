should = require "should"
Zodiac = require "../src/zodiac"

describe "Zodiac", ->
  describe "Node", ->
    beforeEach ->
      @n1 = new Zodiac.Node
      @n2 = new Zodiac.Node
      @n2a = new Zodiac.Node
      @n2b = new Zodiac.Node
      @n2c = new Zodiac.Node
      @n2.addChild @n2a
      @n2.addChild @n2b
      @n2.addChild @n2c

    describe "#isDom()", ->
      it "defaults to false", -> @n1.isDom.should.be.false()

    describe "#lastChild()", ->
      it "returns the last child", ->
        @n2.lastChild().should.equal(@n2._children[2])

    describe "#addChild()", ->
      it "makes children point forward", ->
        @n2._children[0]._next.should.equal(@n2._children[1])
        @n2._children[1]._next.should.equal(@n2._children[2])
        (@n2._children[2]._next == undefined).should.be.true()

      it "makes children point backwards", ->
        (@n2._children[0]._prev == undefined).should.be.true()
        @n2._children[1]._prev.should.equal(@n2._children[0])
        @n2._children[2]._prev.should.equal(@n2._children[1])

      it "makes children point back to the parent", ->
        @n2._children[0]._parent.should.equal(@n2)
        @n2._children[1]._parent.should.equal(@n2)
        @n2._children[2]._parent.should.equal(@n2)

    describe "#_nextElm", ->
      describe "not being an element", ->
        it "is null when it is not followed by or has live elements", ->
          (@n1._nextElm() == null).should.be.true()
          (@n2._nextElm() == null).should.be.true()
          (@n2._children[2]._nextElm() == null).should.be.true()
          @n2._children[1]._element = true
          (@n2._children[2]._nextElm() == null).should.be.true()

        it "returns the next live element", ->
          @n2._children[2]._element = true
          (@n2._children[1]._nextElm()).should.equal(
            @n2._children[2])
          (@n2._children[0]._nextElm()).should.equal(
            @n2._children[2])

        it "returns the first live child element", ->
          @n2._children[2]._element = true
          (@n2._nextElm()).should.equal(@n2._children[2])
          @n2._children[0]._element = true
          (@n2._nextElm()).should.equal(@n2._children[0])

      describe "being an element", ->
        beforeEach -> @n1._element = true
        it "returns itself", ->
          @n1._nextElm().should.equal(@n1)

    describe "#_domContainer", ->
      it "throws when no ancestor #isDom", ->
        fn = -> @n2._children[1]._domContainer()
        fn.should.throw()

      it "returns a direct ancestor that #isDom", ->
        @n2.isDom = true
        @n2._children[1]._domContainer().should.equal(@n2)


    describe "#putDom", ->
      it "throws when it does not have a dom container", ->
        (-> @n2b.putDom("nothing")).should.throw()
        @n2.isDom = true
        (-> @n2b.putDom("nothing")).should.throw()

      it "throws when it is already live", ->
        @n2._element = {}
        (-> @n2.putDom("nothing")).should.throw()

      describe "when root is a live element", ->
        beforeEach ->
          @n2.isDom = true
          @n2._element =
            appendChild: (elm) => @n2.__appended = elm
            insertBefore: (elm) => @n2.__inserted = elm

        describe "with three non-line elements", ->
          it "uses appendChild for the first element", ->
            @n2a._putDom("1")
            @n2.__appended.should.eql("1")

          it "uses appendChild for the middle element", ->
            @n2b._putDom("2")
            @n2.__appended.should.eql("2")

          it "uses appendChild for the last element", ->
            @n2c._putDom("3")
            @n2.__appended.should.eql("3")

        describe "full of live elements", ->
          beforeEach ->
            @n2a.isDom = true
            @n2a._element = {}
            @n2b.isDom = true
            @n2b._element = {}
            @n2c.isDom = true
            @n2c._element = {}

          it "renders at the start using insertBefore", ->
            @n2a._element = undefined
            @n2a._putDom("yoyoba")
            @n2.__inserted.should.eql("yoyoba")

          it "renders in the middle using insertBefore", ->
            @n2b._element = undefined
            @n2b._putDom("yoyoba")
            @n2.__inserted.should.eql("yoyoba")

          it "renders at the end of a tag using appendChild", ->
            @n2c._element = undefined
            @n2c._putDom("yoyo")
            @n2.__appended.should.eql("yoyo")

    describe "#_destroyDom", ->
      it "calls removeChild on the container", ->
        ref = {}
        @n2.isDom = true
        @n2._element =
          removeChild: (elm) => ref.removed = elm
        @n2a.isDom = true
        @n2a._element = "foobar"
        (ref.removed == undefined).should.be.true
        @n2a._destroyDom()
        ref.removed.should.eql "foobar"

      it "throws if it is not mounted", ->
        (-> @n2b._destroyDom()).should.throw()

      it "throws if it does not have a mount point", ->
        @n2.isDom = true
        @n2._element = "fake-elm"
        (-> @n2b._destroyDom()).should.throw()

    describe "Mount", ->
    describe "Text", ->
    describe "Tag", ->
    describe "Seq", ->
    describe "If", ->
    describe "Unless", ->
    describe "For", ->

    describe "integration", ->
      describe "#ast()", ->
      describe "#html()", ->
