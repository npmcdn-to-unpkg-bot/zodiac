
Template = {}

# This module provides some very simple DSL functions that can
# be used to easily construct template ASTs.

Template.availableTags =
   'a abbr address article aside audio b bdi bdo blockquote
   body button canvas caption cite code colgroup datalist dd
   del details dfn div dl dt em fieldset figcaption figure
   footer form h1 h2 h3 h4 h5 h6 head header hgroup html i
   iframe ins kbd label legend li map mark menu meter nav
   noscript object ol optgroup option output p pre progress
   q rp rt ruby s samp script section select small span
   strong style sub summary sup table tbody td textarea tfoot
   th thead time title tr u ul video applet acronym bgsound
   dir frameset noframes isindex area base br col command
   embed hr img input keygen link meta param source track
   wbr basefont frame applet acronym bgsound dir frameset
   noframes isindex listing nextid noembed plaintext rb
   strike xmp big blink center font marquee multicol nobr
   spacer tt basefont frame'.split(/\W+/)

parseItem = (e) ->
  switch e.constructor
    when String, Function then ["Text", e]
    else e

elseVal = {_zElse: true }

parseCond = (kind, args...) ->
  ix = args.indexOf elseVal
  if ix == -1
    args.unshift(kind)
    return args
  cond      = args.shift()
  ifPart    = Template.Template args.slice(0, (ix-1))...
  elsePart  = Template.Template args.slice(ix)...
  [kind, cond, ifPart, elsePart]

# Constructs a template node. A template node is basically just
# a list of nodes that should be rendered after one another.
# You can use this function when you want the root level of
# your template to have more than one node.
#
# When called with a single argument, this function will return
# the corresponding node kind for that item instead, instead of
# a template node.
Template.Template = (seq...) ->
  switch seq.length
    when 0 then ["Template"]
    when 1
      if seq[0]? then parseItem(seq[0]) else ["Template"]
    else
      seq[i] = parseItem(e) for e, i in seq when e?
      ["Template", seq...]

Template.Text = (value) -> ["Text", value]

Template.Tag = (name, args...) ->
  res = ["Tag", name]
  res.push if args[0] && args[0].constructor == Object
    args.shift()
  else {}
  res.push Template.Template(args...) if args.length > 0
  res

Template.If = -> parseCond("If", arguments...)
Template.Unless = -> parseCond("Unless", arguments...)
Template.Else = elseVal
Template.For = (v, arr, seq...) ->
  ["For", v, arr, Template.Template(seq...)]

for t in Template.availableTags
  Template[t] = ((t) -> (-> Template.Tag(t, arguments...)))(t)

module.exports = Template
