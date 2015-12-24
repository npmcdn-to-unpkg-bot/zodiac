
# TODO: refactor this mess

reactivelyIfFunc = (v, scope, processor) ->
  Tracker.autorun ->
    if typeof v == 'function'
      val = v.call scope
      Tracker.nonreactive -> processor val
    else processor v

Renderer =
  render: (ir, appendTo=document.body, scope={}) ->
    ir    = ir.slice()
    # console.log "rendering: #{JSON.stringify ir}"
    kind  = ir.shift() or throw 'empty ir given'
    kls   = this.Render[kind] or throw 'invalid ir kind: ' + kind
    kls ir, appendTo, scope

Renderer.Render =
  tag: (ir, appendTo, scope) ->
    elm   = document.createElement ir.shift() || throw 'empty ir'
    comps = []

    # extract attributes if any
    if ir[0]? and ir[0].constructor == Object
      for name, value of ir.shift()
        comps.push reactivelyIfFunc value, scope, (v) =>
          elm.setAttribute(name, v)

    comp = Renderer.render ir.shift(), elm, scope if ir.length > 0
    appendTo.appendChild elm
    return stop: ->
      # console.log 'removing ' + elm.nodeName + ' tag.'
      appendTo.removeChild(elm)
      comp.stop() if comp
      c.stop() for c in comps
      null

  text: (ir, appendTo, scope) ->
    elm   = document.createTextNode ''
    comp  = reactivelyIfFunc ir.shift(), scope, (v) ->
      elm.nodeValue = v
    appendTo.appendChild elm

    return stop: ->
      # console.log 'removing text ' + elm.nodeValue
      comp.stop()
      appendTo.removeChild elm

  seq: (ir, appendTo, scope) ->
    comps = (Renderer.render n, appendTo, scope for n in ir)
    return stop: ->
      # console.log 'removing sequence'
      c.stop() for c in comps
      null

  if: (ir, appendTo, scope, invert=false) ->
    cond     = ir.shift() or throw 'missing cond'
    trueIr   = ir.shift() or throw 'missing body'
    falseIr  = ir.shift()
    oldTruth = irComp = curIr = undefined

    condComp = reactivelyIfFunc cond, scope, (v) ->
      newTruth = if invert then !v else !!v
      return if newTruth == state
      state = newTruth
      curIr = if state then trueIr else falseIr
      if irComp?
        irComp.stop()
        irComp = undefined
      if curIr?
        irComp = Renderer.render curIr, appendTo, scope

    return stop: ->
      condComp.stop()
      irComp.stop() if irComp?
      null

  unless: (a, b, c) -> Renderer.Render.if(a, b, c, true)

  for: (ir, appendTo, scope) ->
    varName = ir.shift() or throw 'for without varName'
    items   = ir.shift() or throw 'for without items'
    body    = ir.shift() or throw 'for without body'

    branchComps = [] # the reactive render computation
    branchVals  = [] # the reactive iteration variable

    trim = (length) ->
      c.stop() for c in branchComps.slice(length)
      branchComps.length = branchVals.length = length

    itemsComp = reactivelyIfFunc items, scope, (v) ->
      # update the stuff that is already live:
      for i in [0...(Math.min(v.length, branchComps.length))]
        branchVals[i].set(v[i])

      # we're done now if the length did not change
      return if v.length == branchComps.length

      if v.length < branchComps.length # otherwise trim
        trim v.length
      else # or create new branches
        for item in v.slice branchComps.length
          stream = Tracker.Var(item)
          newScope = {}
          newScope[k] = v for k, v of scope
          newScope[varName] = stream.get
          branchVals.push stream
          branchComps.push Renderer.render body, appendTo, newScope

    return stop: -> itemsComp.stop(); trim(0)

module.exports = Renderer
