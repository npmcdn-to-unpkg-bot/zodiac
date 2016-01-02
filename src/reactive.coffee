
Path = require './reactive/path'

Reactive =
  Path:   Path

  var:    Trax.var
  dict:   Trax.dict
  ticker: Trax.ticker
  queue:  Trax.queue

  alerts: -> 
    dep = new Trax.Dependency
    queue = []
    put = (kind, msg) ->
      queue.unshift {kind: kind, msg: msg}
      dep.changed()

    return {
      dep: dep
      put: put,
      get: ->
        dep.depend()
        dep.changed() if queue.length > 0
        queue.pop()

      # canonical bootstrap names
      success:  (msg) -> put 'success', msg
      info:     (msg) -> put 'info',    msg
      warning:  (msg) -> put 'warning', msg
      danger:   (msg) -> put 'danger',  msg

      # convenince aliases
      notify:   (msg) -> put 'info',    msg
      fail:     (msg) -> put 'danger',  msg
      error:    (msg) -> put 'danger',  msg
      }

module.exports  = Reactive
window.Reactive = Reactive if window?
