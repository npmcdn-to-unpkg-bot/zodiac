
Trax     = require 'trax'
Scorpio  = require 'scorpio'

Zodiac =
  Trax:      Trax
  Template:  Scorpio.Template
  Renderer:  Scorpio.Renderer
  Z:         Scorpio.template
  render:    Scorpio.render
  component: Scorpio.component

if window?
  window.Zodiac  = Zodiac
  window.Z       = Zodiac.Z

module.exports = Zodiac
