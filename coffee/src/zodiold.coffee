
# WEB COMPONENTS
#
# A simple but effective implementation of web components as pure
# CoffeeScript

Z.component = (name, params) ->
  {template, render} = params
  template = Z.template params.template if template?

  return render: (appendTo=document.body, scope={}) ->
    newScope    = {}
    newScope[k] = v for k, v of scope
    newScope[k] = v for k, v of params
    view = Z.render template, appendTo, newScope if template?
    cbView = render appendTo, newScope if render?
    return stop: ->
      view.stop() if view?
      cbView.stop() if cbView? and cbView.stop?

window.App = Z.App =
  Path:       new Z.Reactive.Path
  Alerts:     Z.Reactive.alerts()
  Components: {}
  Models:     {}
  State:      {}

