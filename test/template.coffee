should = require "should"
Zodiac = require "../src/zodiac"

describe "Zodiac", ->
  describe "Template", ->
    it "exposes capitalized node helpers", ->
      {Template, Tag, If, Unless, Else, For} = Zodiac.Template
      Template.should.be.ok()
      Tag.should.be.ok()
      If.should.be.ok()
      Unless.should.be.ok()
      Else.should.be.ok()
      For.should.be.ok()

    it "exposes capitalized tag helpers", ->
      {h3, p, hr, div} = Zodiac.Template
      h3.should.be.ok()
      p.should.be.ok()
      hr.should.be.ok()
      div.should.be.ok()

    it "constructs Text nodes", ->
      {Text} = Zodiac.Template
      Text("Hello").should.eql ["Text", "Hello"]

    it "constructs Tag nodes", ->
      {hr} = Zodiac.Template
      hr().should.eql ["Tag", "hr", {}]

    it "constructs Tag nodes", ->
      {p, hr} = Zodiac.Template
      p("hello").should.eql ["Tag", "p", {}, ["Text", "hello"]]

    it "constructs Tag nodes with attributes", ->
      {hr} = Zodiac.Template
      hr(class: "classy").should.eql ["Tag", "hr", {class: "classy"}]

    it "constructs nested Tag nodes", ->
      {div, p} = Zodiac.Template
      t = p("yo", "joda")
      t.should.eql ["Tag", "p", {}, ["Template", ["Text", "yo"], ["Text", "joda"]]]

    it "constructs Template nodes", ->
      {Text, Tag, Template, hr} = Zodiac.Template
      t = Template hr(), "Hello"
      t.should.eql ["Template", ["Tag", "hr", {}], ["Text", "Hello"]]

    it "constructs If nodes", ->
      {Text, If, Else} = Zodiac.Template
      t = If true, "hello", Else, "bye"
      t.should.eql ["If", true, ["Text", "hello"], ["Text", "bye"]]

    it "constructs Unless nodes", ->
      {Text, Unless, Else, hr} = Zodiac.Template
      t = Unless true, "hello", "there", Else, hr(), "yo"
      t.should.eql ["Unless", true,
        ["Template", ["Text", "hello"], ["Text", "there"]],
        ["Template", ["Tag", "hr", {}], ["Text", "yo"]]]

    it "constructs For nodes", ->
      {For} = Zodiac.Template
      t = For "x", [1,2,3], "hello"
      t.should.eql ["For", "x", [1,2,3], ["Text", "hello"]]
