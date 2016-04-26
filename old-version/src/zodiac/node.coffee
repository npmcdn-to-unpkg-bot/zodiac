
# Node requirements:
#
# - visible or invisible
# - iterating backwards or forwards within parent element


class Node
  # Superclass for all Zodiac template nodes.
  #
  # Instance variables:
  # _live      whether the node is currently visible in the browser
  # _prev      the previous node within the parent
  # _next      the next node within the parent
  # _children  child nodes if any
  # _scope     the variable scope used to render
  # _element   the html element itself (for live element nodes)

  isDom: false

  lastChild: -> @_children[@_children.length - 1]

  addChild: (c) ->
    c._parent = this
    if @_children?
      @lastChild()._next = c
      c._prev = @lastChild()
      @_children.push c
    else
      @_children = [c]

  # Returns the next element node within the same dom element
  # as this node, not caring if that node is currently live
  # or not. Returns this node if this node is an element.
  _nextElm: () ->
    if @_element       then this
    else if @_children then @_children[0]._nextElm()
    else if @_next     then @_next._nextElm()
    else
      parent = @_parent
      while parent
        return null if parent.isDom
        return parent._next._nextElm() if parent._next
        parent = parent._parent
      null

  _liveElement: ->
    if @_element then @_element
    else throw "expected a live element"

  # returns the element that this node or its children (in case
  # of non-element nodes) renders to.
  _domContainer: ->
    if @_parent
      if @_parent.isDom then @_parent
      else @_parent._domContainer()
    else
      throw "extepected to be contained in a dom node"

  domContainerElement: -> @_domContainer()._liveElement()

  # Render something to the dom at the position of this element.
  # Used by subclasses to render themselves.
  _putDom: (dom) ->
    throw "already live" if @_element
    if next = @_nextElm()
      @domContainerElement().insertBefore(dom, next)
    else @domContainerElement().appendChild(dom)
    @_element = dom

  _destroyDom: ->
    # TODO destroy component event listeners
    @_domContainer()._element.removeChild(@_liveElement())
    @_element = undefined

  expectLive: -> throw "expected a live node" unless @_live
  expectDead: -> throw "expected a dead node" if @_live

  _goLive: ->
    @expectDead()
    @_live = true
    @_onGoLive()
    if @_children
      c.goLive() for c in @_children

  _die: ->
    @expectLive()
    @_live = false
    if @_children
      c.die() for c in @_children
    @_onDie()

  _onGoLive: -> throw "not implemented"
  _onDie:    -> throw "not implemented"
  innerTemplateStrings: -> c.templateString() for c in @_children
  innerTemplateString:  -> @innerTemplateStrings().join("")

  templateString: ->
    if @_children
      @_openingTag() + "\n" + @innerTemplateString() +
        @_closingTag() + "\n"
    else
      "#{@_singleTag()}\n"

# The mount point for the template tree. Attaches to the dom
class Node.List extends Node
  isDom: true
  constructor: (domElement) -> @_fixture = domElement
  _onGoLive: -> @_element = @_fixture
  _onDie:    -> @_element = undefined

  _openingTag: -> "{{List}}"
  _closingTag: -> "{{/List}}"
  _singleTag:  -> "{{EmptyList/}}"


# Virtual dom node for text
class Node.Text extends Node
  isDom: true
  constructor: (text) -> @_text = text
  _onGoLive: () -> null
  _onDie: () -> null

  _openingTag: -> "{{Text}}"
  _closingTag: -> "{{/Text}}"
  _singleTag:  -> "#{@_text}"

# Virtual dom node for a tag
class Node.Tag extends Node
  isDom: true
  constructor: (@_name, @_props, @_children...) -> null
  _onGoLive: () -> null
  _onDie: () -> null

  propStrings: -> "#{k}=\"#{v}\"" for k, v of @_props
  propString:  ->
    if Object.keys(@_props).length == 0 then ""
    else " #{@propStrings().join(" ")}"

  _openingTag: -> "<#{@_name}#{@propString()}>"
  _closingTag: -> "</#{@_name}>"
  _singleTag:  -> "<#{@_name}#{@propString()}/>"

Node.Else = {__ZodiacElse: true}

# Template condition node (if or unless)
class Node.Condition extends Node
  constructor: (@_cond, lines...) ->
    @_ifPart = []
    @_elsePart = []
    doingIfPart = true
    for line in lines
      if line.__ZodiacElse
        throw "multiple else clauses" unless doingIfPart
        doingIfPart = false
      (if doingIfPart then @_ifPart else @_elsePart).push line
    null

  _onGoLive: () -> null
  _onDie: () -> null

  _kind: -> if @_unless then "Unless" else "If"
  _ifString: ->
  _elseString: ->

  templateString: ->
    # TODO: custom logic
    "{{#{@_kind}}}\n TODO \n{{/#{@_kind}}}\n"

class Node.If extends Node.Condition

class Node.Unless extends Node.Condition
  _unless: true

# Template iterator node (for statement)
class Node.For extends Node
  constructor: (@_list, @_children) -> null
  _onGoLive: () -> null
  _onDie: () -> null

  _openingTag: -> "{{For}}"
  _closingTag: -> "{{/For}}"
  _singleTag:  -> "{{For/}}"

module.exports = Node


