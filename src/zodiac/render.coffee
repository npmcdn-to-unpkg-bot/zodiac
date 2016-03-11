Reactive = require "./reactive"
Node     = require "./render/node"

# TEMPLATE RENDERER
#
# Draws a template ir to the dom, setting up reactive computations
# that will keep it fresh. Returns a computation with a stop() method,
# that can be called to stop the reactive functions and remove the
# template from the dom.

[undefined, null, NaN, 0, "", false]

# takes a value that could be a reactive function.
# and returns a reactive computation.
# runs the processor whenever the value changes,
# ignoring the reactive dependencies of the processor.
reactivelyOn = (v, scope, processor) ->
  Reactive.autorun ->
    v = v.call scope if typeof v == 'function'
    Reactive.nonreactive -> processor v

# TODO: replace appendTo with render nodes

Kinds = {}

_render = (appendTo=document.body, ir, scope={}) ->
  return ir.render appendTo, scope if ir.render?
  ir    = ir.slice()
  kind  = ir.shift()  or throw 'empty ir given'
  kls   = Kinds[kind] or throw 'invalid ir kind: ' + kind
  kls ir, appendTo, scope

Kinds.Text = (ir, appendTo, scope) ->
  elm   = document.createTextNode ''
  comp  = reactivelyOn ir.shift(), scope, (v) ->
    elm.nodeValue = v
  appendTo.appendChild elm

  return stop: ->
    # console.log 'removing text ' + elm.nodeValue
    comp.stop()
    appendTo.removeChild elm

Kinds.Template = (ir, appendTo, scope) ->
  comps = (_render appendTo, n, scope for n in ir)
  return stop: ->
    # console.log 'removing sequence'
    c.stop() for c in comps
    null

Kinds.Tag = (ir, appendTo, scope) ->
  elm   = document.createElement ir.shift() || throw 'empty ir'
  comps = []

  # extract attributes snd events if any
  if ir[0]? and ir[0].constructor == Object
    for name, value of ir.shift()
      if name == '$events'
        capture = false
        for kind, handler of value.handlers
          capture = true if kind == 'capture'
          elm.addEventListener kind, handler, capture
      else
      if name[0] == '$'
        name      = name.slice(1)
        listener  = ((v) -> ((event) -> v.call(scope, event)))(value)
        elm.addEventListener name, listener, false
      else
        comps.push reactivelyOn value, scope, (v) ->
          elm.setAttribute(name, v)

  comp = _render elm, ir.shift(), scope if ir.length > 0
  appendTo.appendChild elm
  return stop: ->
    # console.log 'removing ' + elm.nodeName + ' tag.'
    appendTo.removeChild(elm)
    comp.stop() if comp
    c.stop() for c in comps
    null

Kinds.If = (ir, appendTo, scope, invert=false) ->
  cond     = ir.shift() or throw 'missing cond'
  trueIr   = ir.shift() or throw 'missing body'
  falseIr  = ir.shift()
  oldTruth = irComp = curIr = undefined

  condComp = reactivelyOn cond, scope, (v) ->
    newTruth = if invert then !v else !!v
    return if newTruth == state
    state = newTruth
    curIr = if state then trueIr else falseIr
    if irComp?
      irComp.stop()
      irComp = undefined
    if curIr?
      irComp = _render appendTo, curIr, scope

  return stop: ->
    condComp.stop()
    irComp.stop() if irComp?
    null

Kinds.Unless = (a, b, c) -> Kinds.If(a, b, c, true)

Kinds.For = (ir, appendTo, scope) ->
  varName = ir.shift() or throw 'for without varName'
  items   = ir.shift() or throw 'for without items'
  body    = ir.shift() or throw 'for without body'

  branchComps = [] # the reactive render computation
  branchVals  = [] # the reactive iteration variable

  trim = (length) ->
    c.stop() for c in branchComps.slice(length)
    branchComps.length = branchVals.length = length

  itemsComp = reactivelyOn items, scope, (v) ->
    # update the stuff that is already live:
    for i in [0...(Math.min(v.length, branchComps.length))]
      branchVals[i].set(v[i])

    # we're done now if the length did not change
    return if v.length == branchComps.length

    if v.length < branchComps.length # otherwise trim
      trim v.length
    else # or create new branches
      for item in v.slice branchComps.length
        stream = Reactive.var(item)
        newScope = {}
        newScope[k] = v for k, v of scope
        newScope[varName] = stream.get
        branchVals.push stream
        branchComps.push _render appendTo, body, newScope

  return stop: ->
    itemsComp.stop()
    trim(0)
    null

module.exports = _render

