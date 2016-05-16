Template = require "../src/zodiac/template"
Reactive = require "../src/zodiac/reactive"
render   = require "../render"


describe "Zodiac", ->
  describe "#render", ->
    it "is a function", ->
      render.constructor.should.equal Function

    unless window?
      console.log "No DOM. Skipping rendering tests."
    else

      fixture = document.getElementById("fixture")

      it "has a div to draw to in the test page", ->
        fixture.should.be.ok

      it "can render plain text", ->
        comp = render fixture, Template.Text("hello")
        fixture.innerHTML.should.eql "hello"
        comp.stop()
        fixture.innerHTML.should.eql ""

      it "can render p tag", ->
        comp = render fixture, Template.p(Template.Text("hello"))
        fixture.innerHTML.should.eql "<p>hello</p>"
        comp.stop()
        fixture.innerHTML.should.eql ""

      it "can render hr tag with class", ->
        comp = render fixture, Template.hr(class: "classy")
        fixture.firstChild.className.should.eql "classy"
        comp.stop()
        fixture.innerHTML.should.eql ""

      # TODO: test render node implementation

      # static if
      # static unless
      # static for
      # complex static example
      #
      # dynamic versions of all the above
      # stuff that potentially reorders the elements unintentionally
