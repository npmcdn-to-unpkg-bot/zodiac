
Trax = require 'trax'

# Template DSL
#
# Zodiac Template DSL for CoffeeScript that can be used to generate
# reactive template IR's. This is designed to be used by client-side
# javascript that has been compiled from CoffeeScript.
#
# We do not allow precompiling templates on the server, because they
# would be harder to debug (the reactive callbacks would have to be
# eval-ed on the client). There is no real performance hit because
# of this, and Zodiac is still much faster and smaller than the major
# reactive frameworks.
#
# Actually, we do something controversial here, and add a lot of
# helpers to the global window scope, so that you get a template
# DSL there.

# Tags for which to generate helpers
# The `var` element is out for obvious reasons, please use `tag 'var'`.
_tags = 'a abbr address article aside audio b bdi bdo blockquote body
  button canvas caption cite code colgroup datalist dd del details dfn
  div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6
  head header hgroup html i iframe ins kbd label legend li map mark
  menu meter nav noscript object ol optgroup option output p pre
  progress q rp rt ruby s samp script section select small span strong
  style sub summary sup table tbody td textarea tfoot th thead time
  title tr u ul video applet acronym bgsound dir frameset noframes
  isindex area base br col command embed hr img input keygen link meta
  param source track wbr basefont frame applet acronym bgsound dir
  frameset noframes isindex listing nextid noembed plaintext rb strike
  xmp big blink center font marquee multicol nobr spacer tt basefont
  frame'.split(/\W+/)

$ = # IR node names
  text:   'text'
  tag:    'tag'
  seq:    'seq'
  if:     'if'
  unless: 'unless'
  for:    'for'

_parseItem = (e) ->
  switch e.constructor
    when String, Function then [$.text, e]
    else e

_parseList = (seq) ->
  switch seq.length
    when 0 then [$.seq]
    when 1
      if seq[0]? then _parseItem(seq[0]) else [$.seq]
    else
      seq[i] = _parseItem(e) for e, i in seq when e?
      seq.unshift $.seq; seq

_elseVal = {zElse: true} # value of else in generated ir.

_ifImpl = (kind, args...) ->
  ix = args.indexOf(_elseVal)
  if ix == -1
    args.unshift(kind)
    return args
  cond      = args.shift()
  ifPart    = _parseList args.slice(0, (ix-1))
  elsePart  = _parseList args.slice(ix)
  [kind, cond, ifPart, elsePart]

Template =
  DSL:
    tag: (name, args...) ->
      seq   = []
      props = {}
      for arg in args
        switch arg.constructor
          when Object then props[k] = v for k, v of arg
          when String, Function then seq.push [$.text, arg]
          else seq.push arg
      r = [$.tag, name]
      r.push props if !Object.keys || Object.keys(props).length > 0
      r.push _parseList(seq) if seq.length > 0
      r

    _if:      -> _ifImpl($.if,     arguments...)
    _unless:  -> _ifImpl($.unless, arguments...)
    _else:    _elseVal
    _for:    (v, arr, seq...) -> [$.for, v, arr, _parseList(seq)]
    out:     (args...) -> args.unshift('text'); args

  create: -> _parseList(arguments) # Template definition function

  $: $
  infest: (obj) -> obj[k] = v for k, v of Template.DSL

for t in _tags
  # create closures to preserve the value of t in each function
  Template.DSL[t] = ((t) -> (-> Template.DSL.tag(t, arguments...)))(t)

Template.infest(window) if window?


# Reactive renderer
#
# Draws a Scorpio ir to some part of the dom, while also setting
# up reactive computations that will keep it live over time. Returns
# and object that will respond to .stop(), which can be called to stop
# the reactive functions, and remove the template from the dom again.

reactivelyIfFunc = (v, scope, processor) ->
  Trax.autorun ->
    if typeof v == 'function'
      val = v.call scope
      Trax.nonreactive -> processor val
    else processor v

Renderer =
  # Rendering per IR node
  Nodes:
    tag: (ir, appendTo, scope) ->
      elm   = document.createElement ir.shift() || throw 'empty ir'
      comps = []

      # extract attributes snd events if any
      if ir[0]? and ir[0].constructor == Object
        for name, value of ir.shift()
          if name[0] == '$'
            name      = name.slice(1)
            listener  = (event) -> value.call(scope, event)
            if elm.addEventListener
              elm.addEventListener name, listener, false
            else elm.attachEvent "on#{name}", listener
          else
            comps.push reactivelyIfFunc value, scope, (v) ->
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

    unless: (a, b, c) -> Renderer.Nodes.if(a, b, c, true)

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
            stream = Trax.var(item)
            newScope = {}
            newScope[k] = v for k, v of scope
            newScope[varName] = stream.get
            branchVals.push stream
            branchComps.push Renderer.render body, appendTo, newScope

      return stop: -> itemsComp.stop(); trim(0)

  # Renderer entry point
  render: (ir, appendTo=document.body, scope={}) ->
    return ir.render appendTo, scope if ir.render?
    ir    = ir.slice()
    kind  = ir.shift()        or throw 'empty ir given'
    kls   = Renderer.Nodes[kind] or throw 'invalid ir kind: ' + kind
    kls ir, appendTo, scope


# Main Scorpio class
#
# Contains links to the internal implementations,
# and a simple but nice component implementation.

Scorpio =
  Template: Template
  Renderer: Renderer
  template: Template.create
  render:   Renderer.render

module.exports = Scorpio
