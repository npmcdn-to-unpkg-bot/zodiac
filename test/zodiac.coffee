
Zodiac = require("../src/zodiac")

# TODO: This file just contains stuff that lacks tests or now.

describe "Zodiac", ->

  describe "public api", ->

    beforeEach ->
      jasmine.addMatchers require("./_customMatchers")

    it "has tracker functions", ->
      expect(Zodiac).toHaveFunctions(
        'Dep autorun nonreactive flush onInvalidate')

    it "has variable functions", ->
      expect(Zodiac).toHaveFunctions("$ Dict Follow")

    it "has template functions", ->
      expect(Zodiac).toHaveFunctions(
        "mount text tag cond loop dynamic component dom " +
        "p a h1 div abbr pre frameset") # and so on...

    it "has utility functions", ->
      expect(Zodiac).toHaveFunctions("IntervalTimer")

