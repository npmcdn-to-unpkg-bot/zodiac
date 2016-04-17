
# A live node. It can be a dom node, or template logic.
# This is used by the recursive reactive render call to track
# the changing structure of the template, so that reinserted
# dom elements always get appended at the right place, even
# when there are complex reactive if's and loops inside a single
# dom element
class Node
  constructor: (@parent, @prev) ->

  createChild: ->
    last = @children[@children.length - 1] if @children
    ins  = new Node this, last
    last.next = ins if last
    (@children ||= []).push ins
    ins

  dropChildren: -> @trimChildren(0)

  drop: ->
    @domContainer().dom.removeChild(@dom) if @dom?
    @prev.next = undefined if @prev
    @next.prev = undefined if @next
    @prev = @next = @dom = @parent = undefined

  trimChildren: (cut) ->
    c.drop() for c in @children.slice(cut)
    @children = @children.slice(0, cut)

  # returns the element that this node or its children (in case
  # of non-element nodes) renders to.
  domContainer: ->
    if @parent
      if @parent.dom? then @parent
      else @parent.domContainer()
    else throw "expected to be contained in a dom node"

  nextDom: ->
    next = this
    while next = next.next
      return next if next.dom?
      return d if d = @next.firstWrappedDom()
    if @parent.dom then undefined
    else @parent.nextDom

  firstWrappedDom: ->
    switch
      when @dom then this
      when @children
        for c in @children
          return d if d = c.firstWrappedDom()
    undefined

  renderDom: (node) ->
    throw "already live" if @dom
    if next = @nextDom()
      @domContainer().insertBefore(dom, next)
    else @domContainer().appendChild(dom)
    @dom = dom

module.exports = Node
