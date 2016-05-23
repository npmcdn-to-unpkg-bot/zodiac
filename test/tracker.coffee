Zodiac = require("../src/zodiac")

describe "Tracker", ->
  # Tracker is already tested as part of Meteor.
  # Here we just define what to expose.

  beforeEach ->
    jasmine.addMatchers require("./_customMatchers")

  it "exposes our public api", ->
    expect(Zodiac).toHaveFunctions(
      'Dep autorun nonreactive flush onInvalidate')
