
Trax     = require 'trax'
Scorpio  = require 'scorpio'
Sheets   = require 'coffee-sheets'
Reactive = require './reactive'

Zodiac =
  Trax:     Trax
  Reactive: Reactive
  Sheets:   Sheets
  Template: Scorpio.Template
  Renderer: Scorpio.Renderer

  template: Scorpio.template
  render:   Scorpio.render

  component: (name, params) ->
    {template, render, init} = params
    template = Scorpio.Template.create params.template if template?
    init() if init?

    levels = {}
    for level in Sheets.levels
      if params["#{level}_css"]?
        levels[level] = params["#{level}_css"]

    sheet = Sheets.create name, levels

    return render: (appendTo=document.body, scope={}) ->
      sheet.activate()
      newScope    = {}
      newScope[k] = v for k, v of scope
      newScope[k] = v for k, v of params
      view = Scorpio.Renderer.render template, appendTo, newScope if template?
      cbView = render appendTo, newScope if render?
      return stop: ->
        view.stop() if view?
        cbView.stop() if cbView? and cbView.stop?

  App:
    path:     new Reactive.Path
    alerts:   Reactive.alerts()

if window?
  window.Zodiac = window.Z = Zodiac
  window.App    = Zodiac.App

module.exports = Zodiac
