{
  IntervalTimer

} = require("../src/zodiac")

describe "Utils", ->

  describe "IntervalTimer", ->
    it "uses setInterval and clearInterval", ->
      spyOn(window, "setInterval")
      spyOn(window, "clearInterval")
      timer = IntervalTimer(1000, (id) -> id)
      expect(window.setInterval).toHaveBeenCalled()
      timer.stop()
      expect(window.clearInterval).toHaveBeenCalled()

