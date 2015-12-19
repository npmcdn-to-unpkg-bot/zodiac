
# TODO: refactor this mess

class ReactiveFuncs
  constructor: (value) ->
    @value  = value
    @dep    = new Tracker.Dependency
    @getter = =>
      @dep.depend()
      console.log 'read pipe: ' + @value
      @value
    @setter = (v) =>
      if v != @value
        console.log 'write pipe: ' + @value + ' to ' + v
        @value = v
        @dep.changed()

reactivelyIfFunc = (v, scope, processor) ->
  Tracker.autorun =>
    if typeof v == 'function'
      processor(v.call(scope))
    else processor(v)

class Renderer
  @render: (ir, appendTo=document.body, scope={}) ->
    kind  = ir[0] or throw 'empty ir given'
    console.log kind
    kls   = this.Render[kind.charAt(0).toUpperCase() + kind.slice(1)] or
            throw 'invalid ir kind: ' + kind
    new kls ir.slice(1), appendTo, scope

  class @Render
    class @Tag
      constructor: (ir, @_appendTo, @_scope) ->
        console.log ir
        @_elm       = document.createElement(ir.shift())
        @_comps     = []

        if ir[0]? and ir[0].constructor == Object
          for name, value of ir.shift()
            @_comps.push reactivelyIfFunc value, @_scope, (v) =>
              @_elm.setAttribute(name, v)

        @_comp = Renderer.render ir.shift(), @_elm, @_scope if ir.length > 0
        @_appendTo.appendChild @_elm

      stop: ->
        console.log 'removing ' + @_elm.nodeName + ' tag.'
        @_appendTo.removeChild(@_elm)
        @_comp.stop() if @_comp
        c.stop() for c in @_comps

    class @Text
      constructor: (ir, @_appendTo, @_scope) ->
        @_elm       = document.createTextNode ''

        @_comp = reactivelyIfFunc ir.shift(), @_scope, (v) =>
          console.log 'changed text node to ' + v
          @_elm.nodeValue = v

        @_appendTo.appendChild @_elm

      stop: ->
        console.log 'removing text ' + @_elm.nodeValue
        @_appendTo.removeChild(@_elm)
        @_comp.stop()

    class @Seq
      constructor: (ir, @_appendTo, @_scope) ->
        @comp = Renderer.render child, @_appendTo, @_scope for child in ir

      stop: ->
        console.log 'removing sequence'
        @comp.stop()

    class @If
      constructor: (ir, @_appendTo, @_scope) ->

        cond       = ir.shift() or throw @constructor.name + ' without cond'
        trueIr     = ir.shift() or throw @constructor.name + ' without body'
        falseIr    = ir.shift()

        reactivelyIfFunc cond, @_scope, (v) =>
          newTruth = @_evalCond(v)
          if newTruth == @_state then return else @_state = newTruth
          branchIr = if @_state then trueIr else falseIr
          @_branchComp.stop() if @_branchComp?
          @_branchComp = if branchIr? then Z.render branchIr, @_appendTo, @_scope else null

      _evalCond: (v) -> !!v

      stop: -> @_branchComp.stop() if @_branchComp?

    class @Unless extends @If
      _evalCond: -> (v) -> !v

    class @Each
      constructor: (ir, @_appendTo, @_scope) ->
        varName = ir.shift() or throw 'each without varName'
        items   = ir.shift() or throw 'each without items'
        action  = ir.shift() or throw 'each without body'
        # todo different forms, including no var, and index var..

        # we keep one for each branch of..
        @_branchComps = [] # the reactive render computation
        @_branchVals  = [] # the iteration variable getter/setter

        reactivelyIfFunc items, @_scope, (v) =>
          Tracker.nonreactive =>
            for i in [0...(Math.min(v.length, @_branchComps.length))]
              @_branchVals[i].setter(v[i])

          console.log 'returning' if v.length == @_branchComps.length
          return if v.length == @_branchComps.length

          if v.length < @_branchComps.length
            @trim v.length
          else
            oldVal = @_scope[varName]
            for item in v.slice(@_branchComps.length)
              funcs = new ReactiveFuncs(item)
              @_scope[varName] = funcs.getter
              @_branchVals.push funcs
              @_branchComps.push Renderer.render action, @_appendTo, @_scope
            @_scope[varName] = oldVal

      trim: (length) ->
        c.stop() for c in @_branchComps.slice(length)
        @_branchComps.length = @_branchVals.length = length

      stop: -> @trim(0)

  @nodeKinds: 'tag text seq if unless each'.split(' ')
  @buildScope: {}

  @defHelper: (name, args...) ->
    @buildScope[name] = (args...) => args.unshift name; args

  @defHelper(kind) for kind in @nodeKinds

module.exports = Renderer
