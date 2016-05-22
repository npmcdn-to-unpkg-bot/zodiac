

Zodiac = require("../src/zodiac")

describe "Zodiac", ->
  it "can be imported", ->
    expect(Zodiac).toBeDefined()

  it "exposes tracker api", ->
    expect(typeof Zodiac.autorun).toEqual("function")
    expect(typeof Zodiac.nonreactive).toEqual("function")

  it "exposes variable api", ->
    expect(typeof Zodiac.$).toEqual("function")

  it "exposes template api", ->
    expect(typeof Zodiac.dom).toEqual("function")
    expect(typeof Zodiac.mount).toEqual("function")
    expect(typeof Zodiac.p).toEqual("function")
    expect(typeof Zodiac.a).toEqual("function")
    expect(typeof Zodiac.h1).toEqual("function")
    expect(typeof Zodiac.div).toEqual("function")

  it "exposes utility api", ->
    expect(typeof Zodiac.IntervalTimer).toEqual("function")

