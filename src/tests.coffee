
Unit        = require './tests/unit'
Integration = require './tests/integration'

Tracker     = require './tracker'
Zodiac      = require './zodiac'
Template    = require './template'


onDomReady = (cb) ->
  if window?
    window.onload = cb
  else
    # TODO: set up fake dom
    cb()


onDomReady ->
  Unit.run()
  Integration.run()

