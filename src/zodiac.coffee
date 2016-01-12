
unless window?
  return console.log 'Window unavailable. Needs browser.'

window.Z = window.Zodiac = {}

require './reactive'
require './reactive/path'
require './coffee-sheets'

# TEMPLATE DSL
#
# Template DSL for CoffeeScript. Used to generate template IR's.
# This is designed to run client-side, using templates in the form
# of compiled coffee-script. We do not allow precompiling templates.

Z.template = do ->
  # The `var` element is out for obvious reasons.
  _tags = 'a abbr address article aside audio b bdi bdo blockquote body
    button canvas caption cite code colgroup datalist dd del details
    dfn div dl dt em fieldset figcaption figure footer form h1 h2 h3
    h4 h5 h6 head header hgroup html i iframe ins kbd label legend li
    map mark menu meter nav noscript object ol optgroup option output
    p pre progress q rp rt ruby s samp script section select small
    span strong style sub summary sup table tbody td textarea tfoot th
    thead time title tr u ul video applet acronym bgsound dir frameset
    noframes isindex area base br col command embed hr img input
    keygen link meta param source track wbr basefont frame applet
    acronym bgsound dir frameset noframes isindex listing nextid
    noembed plaintext rb strike xmp big blink center font marquee
    multicol nobr spacer tt basefont frame'.split(/\W+/)

  $$ = # IR node names
    text:   'text'
    tag:    'tag'
    seq:    'seq'
    if:     'if'
    unless: 'unless'
    for:    'for'

  _list = (seq) ->
    _parseItem = (e) ->
      switch e.constructor
        when String, Function then [$$.text, e]
        else e

    switch seq.length
      when 0 then [$$.seq]
      when 1
        if seq[0]? then _parseItem(seq[0]) else [$$.seq]
      else
        seq[i] = _parseItem(e) for e, i in seq when e?
        [$$.seq, seq...]

  _elseVal = _zElse: true # value of else in generated ir.

  _ifImpl = (kind, args...) ->
    ix = args.indexOf _elseVal
    if ix == -1
      args.unshift(kind)
      return args
    cond      = args.shift()
    ifPart    = _list args.slice(0, (ix-1))
    elsePart  = _list args.slice(ix)
    [kind, cond, ifPart, elsePart]

  _dsl =
    tag: (name, args...) ->
      seq   = []
      props = {}
      for arg in args
        switch arg.constructor
          when Object then props[k] = v for k, v of arg
          when String, Function then seq.push [$$.text, arg]
          else seq.push arg
      r = [$$.tag, name]
      r.push props if !Object.keys || Object.keys(props).length > 0
      r.push _list(seq) if seq.length > 0
      r

    _if:      -> _ifImpl($$.if,     arguments...)
    _unless:  -> _ifImpl($$.unless, arguments...)
    _else:   _elseVal
    _for:    (v, arr, seq...) -> [$$.for, v, arr, _list(seq)]
    #out:     (args...) -> args.unshift('text'); args

  for t in _tags
    _dsl[t] = ((t) -> (-> _dsl.tag(t, arguments...)))(t)

  window[k] = v for k, v of _dsl
  return -> _list arguments # template creation function


# TEMPLATE RENDERER
#
# Draws a template ir to the dom, setting up reactive computations
# that will keep it fresh. Returns an object with a stop() method,
# that can be called to stop the reactive functions and remove the
# template from the dom.
Z.render = do ->

  _reactivelyIfFunc = (v, scope, processor) ->
    Z.Reactive.autorun ->
      if typeof v == 'function'
        val = v.call scope
        Z.Reactive.nonreactive -> processor val
      else processor v

  _ref = {} # used to set up mutual recursion

  _renderers =
    tag: (ir, appendTo, scope) ->
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
            comps.push _reactivelyIfFunc value, scope, (v) ->
              elm.setAttribute(name, v)

      comp = _ref.render ir.shift(), elm, scope if ir.length > 0
      appendTo.appendChild elm
      return stop: ->
        # console.log 'removing ' + elm.nodeName + ' tag.'
        appendTo.removeChild(elm)
        comp.stop() if comp
        c.stop() for c in comps
        null

    text: (ir, appendTo, scope) ->
      elm   = document.createTextNode ''
      comp  = _reactivelyIfFunc ir.shift(), scope, (v) ->
        elm.nodeValue = v
      appendTo.appendChild elm

      return stop: ->
        # console.log 'removing text ' + elm.nodeValue
        comp.stop()
        appendTo.removeChild elm

    seq: (ir, appendTo, scope) ->
      comps = (_ref.render n, appendTo, scope for n in ir)
      return stop: ->
        # console.log 'removing sequence'
        c.stop() for c in comps
        null

    if: (ir, appendTo, scope, invert=false) ->
      cond     = ir.shift() or throw 'missing cond'
      trueIr   = ir.shift() or throw 'missing body'
      falseIr  = ir.shift()
      oldTruth = irComp = curIr = undefined

      condComp = _reactivelyIfFunc cond, scope, (v) ->
        newTruth = if invert then !v else !!v
        return if newTruth == state
        state = newTruth
        curIr = if state then trueIr else falseIr
        if irComp?
          irComp.stop()
          irComp = undefined
        if curIr?
          irComp = _ref.render curIr, appendTo, scope

      return stop: ->
        condComp.stop()
        irComp.stop() if irComp?
        null

    unless: (a, b, c) -> _renderers.if(a, b, c, true)

    for: (ir, appendTo, scope) ->
      varName = ir.shift() or throw 'for without varName'
      items   = ir.shift() or throw 'for without items'
      body    = ir.shift() or throw 'for without body'

      branchComps = [] # the reactive render computation
      branchVals  = [] # the reactive iteration variable

      trim = (length) ->
        c.stop() for c in branchComps.slice(length)
        branchComps.length = branchVals.length = length

      itemsComp = _reactivelyIfFunc items, scope, (v) ->
        # update the stuff that is already live:
        for i in [0...(Math.min(v.length, branchComps.length))]
          branchVals[i].set(v[i])

        # we're done now if the length did not change
        return if v.length == branchComps.length

        if v.length < branchComps.length # otherwise trim
          trim v.length
        else # or create new branches
          for item in v.slice branchComps.length
            stream = Z.Reactive.var(item)
            newScope = {}
            newScope[k] = v for k, v of scope
            newScope[varName] = stream.get
            branchVals.push stream
            branchComps.push _ref.render body, appendTo, newScope

      return stop: -> itemsComp.stop(); trim(0)

  _ref.render = (ir, appendTo=document.body, scope={}) ->
    return ir.render appendTo, scope if ir.render?
    ir    = ir.slice()
    kind  = ir.shift()        or throw 'empty ir given'
    kls   = _renderers[kind] or throw 'invalid ir kind: ' + kind
    kls ir, appendTo, scope

  return _ref.render

# WEB COMPONENTS
#
# A simple but effective implementation of web components as pure
# CoffeeScript

Z.component = (name, params) ->
  {template, render, init} = params
  template = Z.template params.template if template?
  init() if init?

  levels = {}
  for level in Z.Sheets.levels
    if params["#{level}_css"]?
      levels[level] = params["#{level}_css"]

  sheet = Z.Sheets.create name, levels

  return render: (appendTo=document.body, scope={}) ->
    sheet.activate()
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

