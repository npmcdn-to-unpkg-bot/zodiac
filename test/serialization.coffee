
{
  $, Persist, LocalStorage, SerializeTo, deserialize, dump,
  flush

} = require("../src/zodiac")

describe "Serialization", ->

  vals = [0, 1, true, false, {}, [],
    {test: "1"},
    [1,2,3],
    {a: [{b: c: { so: "deep" }}]}
  ]

  describe "Persist", ->
    it "works as expected", ->
      v = $(0)
      calledWithData = "nope"
      p = Persist(v,
        load: -> "secret",
        save: (data) -> calledWithData = data.get()
      )
      expect(v.get()).toEqual("secret")
      expect(calledWithData).toEqual("nope")
      expect(p.saved.get()).toEqual(true)
      v.set(1)
      flush()
      expect(p.saved.get()).toEqual(false)
      expect(calledWithData).toEqual("nope")
      p.save()
      expect(calledWithData).toEqual(1)
      expect(p.saved.get()).toEqual(true)
      p.reload()
      expect(v.get()).toEqual("secret")
      expect(p.saved.get()).toEqual(true)
      p.save()
      expect(calledWithData).toEqual("secret")

  describe "localStorage", ->
    it "works as expected", ->
      store = LocalStorage("foo")
      for v in vals
        store.save(v)
        expect(localStorage.getItem("foo")).toEqual(JSON.stringify(v))
        expect(store.load()).toEqual(v)
        localStorage.clear()

  describe "dump", ->

    it "passes plain values through", ->
      for v in vals
        expect(dump(v)).toEqual(v)

    it "wraps reactive values", ->
      for v in vals
        json = dump($(v))
        expect(json.__$isZV).toEqual(1)
        expect(json.v).toEqual(v)

    it "wraps undefined values", ->
      expect(dump(undefined)).toEqual("__$isZUNDEF")

  describe "deserialize", ->

    it "passes plain values through", ->
      for v in vals
        expect(deserialize(v)).toEqual(v)

    it "unpacks reactive values", ->
      for v in vals
        result = deserialize({__$isZV: 1, v})
        expect(result.constructor.name).toEqual("ZVar")
        expect(result.get()).toEqual(v)

    it "unpacks undefined values", ->
      expect(deserialize("__$isZUNDEF")).toEqual(undefined)

  describe "SerializeTo", ->

    source = {
      hello: $([
        "test",
        1,
        $("str"),
        $({
          yo: $(true)
        })])
    }

    serialized =
      hello:
        __$isZV: 1,
        v: [
          "test",
          1,
          {
            __$isZV: 1,
            v: "str"
          },
          {
            __$isZV: 1,
            v: {
              yo: {
                __$isZV: 1,
                v: true
              },
            }
          }
        ]

    it "loads nested data", ->

      s = SerializeTo( load: -> serialized)
      v = s.load()

      expect(v).toBeDefined()
      expect(v.hello.constructor.name).toEqual("ZVar")
      expect(v.hello.get()[0]).toEqual("test")
      expect(v.hello.get()[1]).toEqual(1)
      expect(v.hello.get()[2].constructor.name).toEqual("ZVar")
      expect(v.hello.get()[2].get()).toEqual("str")
      expect(v.hello.get()[3].get().yo.get()).toBe(true)

      expect(Object.keys(v)).toEqual(['hello'])
      expect(Object.keys(v.hello.get()[3].get())).toEqual(['yo'])

    it "dumps nested data", ->
      dumped = undefined
      serializer = SerializeTo(save: (val) -> dumped = val)
      serializer.save(source)
      expect(dumped).toEqual(serialized)

    it "verifies against itself", ->
      dumped = undefined
      serializer = SerializeTo(
        load: -> serialized,
        save: (val) -> dumped = val
      )
      serializer.save(serializer.load(serialized))
      expect(dumped).toEqual(serialized)
