
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
  for:   'for'

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

    Z: -> _parseList(arguments) # Template definition function

  $: $
  infest: (obj) -> obj[k] = v for k, v of Template.DSL

for t in _tags
  # create closures to preserve the value of t in each function
  Template.DSL[t] = ((t) -> (-> Template.DSL.tag(t, arguments...)))(t)

Template.infest(window) if window?

module.exports = Template
