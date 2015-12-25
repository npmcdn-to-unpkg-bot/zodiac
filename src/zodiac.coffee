
Template = require './template'
Renderer = require './renderer'
Tracker  = require './tracker'

Zodiac =
  Template: Template
  Renderer: Renderer
  Tracker:  Tracker
  Z:        Template.DSL.Z
  render: -> Zodiac.Renderer.render arguments...

  component: (params) ->
    throw 'missing template' unless params.template?
    {template, init} = params
    template = Template.DSL.Z params.template
    delete params[field] for field in 'template init'.split(' ')

    return render: (appendTo=document.body, scope={}) ->
      newScope    = {}
      newScope[k] = v for k, v of scope
      newScope[k] = v for k, v of params
      init(scope) if init?
      Renderer.render template, appendTo, newScope


module.exports = Zodiac
window.Zodiac  = Zodiac if window?
