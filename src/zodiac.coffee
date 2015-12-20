
Zodiac =
  Template: require './template'
  Renderer: require './renderer'
  Tracker:  require './tracker'
  render: -> Zodiac.Renderer.render arguments...

module.exports = Zodiac
window.Zodiac  = Zodiac if window?
