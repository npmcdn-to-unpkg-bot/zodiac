
Tracker   = require './tracker'
Zodiac    = require './zodiac'
Template  = require './template'
Examples  = require '../examples'

# TODO

window.Zodiac   = Zodiac
window.Tracker  = Tracker
window.Template = Template
window.Examples = Examples

window.example = (name) -> Zodiac.render Examples[name]

window.onload = ->
  document.body.innerHTML = '<p>Javascript loaded.</p>'
