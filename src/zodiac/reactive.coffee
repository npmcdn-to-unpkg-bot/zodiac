

# This is Meteor Tracker, ripped from the Meteor platform, converted to
# coffee, trimmed and slightly rewritten.

R =
  active:             false
  currentComputation: null
  _computations:      {}

setCurrentComputation = (c) ->
  R.currentComputation = c
  R.active = !!c
  return

_throwOrLog = (from, e) ->
  throw e if throwFirstError
  printArgs = [ 'Exception from Reactive ' + from + ' function:' ]
  if e.stack and e.message and e.name
    idx = e.stack.indexOf(e.message)
    if idx < 0 or idx > e.name.length + 2
      message = e.name + ': ' + e.message
      printArgs.push message
  printArgs.push e.stack
  i = 0
  while i < printArgs.length
    console.log printArgs[i]
    i++
  return

withNoYieldsAllowed = (f) -> f

nextId              = 1
pendingComputations = []
willFlush           = false
inFlush             = false
inCompute           = false
throwFirstError     = false
afterFlushCallbacks = []

requireFlush = ->
  if !willFlush
    setTimeout R._runFlush, 0
    willFlush = true
  return

constructingComputation = false

R.Computation = (f, parent, onError) ->
  if !constructingComputation
    throw new Error('Reactive.Computation constructor is private; use Reactive.autorun')
  constructingComputation = false
  self = this
  self.stopped = false
  self.invalidated = false
  self.firstRun = true
  self._id = nextId++
  self._onInvalidateCallbacks = []
  self._onStopCallbacks = []
  self._parent = parent
  self._func = f
  self._onError = onError
  self._recomputing = false
  R._computations[self._id] = self
  errored = true
  try
    self._compute()
    errored = false
  finally
    self.firstRun = false
    if errored
      self.stop()
  return

R.Computation::onInvalidate = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onInvalidate requires a function')
  if self.invalidated
    R.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onInvalidateCallbacks.push f
  return

R.Computation::onStop = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onStop requires a function')
  if self.stopped
    R.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onStopCallbacks.push f
  return

R.Computation::invalidate = ->
  self = this
  if !self.invalidated
    if !self._recomputing and !self.stopped
      requireFlush()
      pendingComputations.push this
    self.invalidated = true
    i = 0
    f = undefined
    while f = self._onInvalidateCallbacks[i]
      R.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onInvalidateCallbacks = []
  return

R.Computation::stop = ->
  self = this
  if !self.stopped
    self.stopped = true
    self.invalidate()
    delete R._computations[self._id]
    i = 0
    f = undefined
    while f = self._onStopCallbacks[i]
      R.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onStopCallbacks = []
  return

R.Computation::_compute = ->
  self                  = this
  self.invalidated      = false
  previous              = R.currentComputation
  setCurrentComputation self
  previousInCompute     = inCompute
  inCompute             = true
  try
    withNoYieldsAllowed(self._func) self
  finally
    setCurrentComputation previous
    inCompute = previousInCompute
  return

R.Computation::_needsRecompute = ->
  self = this
  self.invalidated and !self.stopped

R.Computation::_recompute = ->
  self = this
  self._recomputing = true
  try
    if self._needsRecompute()
      try
        self._compute()
      catch e
        if self._onError
          self._onError e
        else
          _throwOrLog 'recompute', e
  finally
    self._recomputing = false
  return

R.Dependency = ->
  @_dependentsById = {}
  return

R.Dependency::depend = (computation) ->
  if !computation
    if !R.active
      return false
    computation = R.currentComputation
  self = this
  id = computation._id
  if !(id of self._dependentsById)
    self._dependentsById[id] = computation
    computation.onInvalidate ->
      delete self._dependentsById[id]
      return
    return true
  false

R.Dependency::changed = ->
  self = this
  for id of self._dependentsById
    self._dependentsById[id].invalidate()
  return

R.Dependency::hasDependents = ->
  self = this
  for id of self._dependentsById
    return true
  false

R.flush = (options) ->
  R._runFlush
    finishSynchronously: true
    throwFirstError: options and options._throwFirstError
  return

R._runFlush = (options) ->
  throw new Error('Can\'t call Reactive.flush while flushing') if inFlush
  throw new Error('Can\'t flush inside Reactive.autorun') if inCompute
  options         = options or {}
  inFlush         = true
  willFlush       = true
  throwFirstError = !!options.throwFirstError
  recomputedCount = 0
  finishedTry     = false
  try
    while pendingComputations.length or afterFlushCallbacks.length
      while pendingComputations.length
        comp = pendingComputations.shift()
        comp._recompute()
        if comp._needsRecompute()
          pendingComputations.unshift comp
        if !options.finishSynchronously and ++recomputedCount > 1000
          finishedTry = true
          return
      if afterFlushCallbacks.length
        func = afterFlushCallbacks.shift()
        try
          func()
        catch e
          _throwOrLog 'afterFlush', e
    finishedTry = true
  finally
    if !finishedTry
      inFlush = false
      R._runFlush
        finishSynchronously: options.finishSynchronously
        throwFirstError: false
    willFlush = false
    inFlush = false
    if pendingComputations.length or afterFlushCallbacks.length
      if options.finishSynchronously
        throw new Error('still have more to do?')
      setTimeout requireFlush, 10
  return

R.autorun = (f, options) ->
  if typeof f != 'function'
    throw new Error('Reactive.autorun requires a function argument')
  options = options or {}
  constructingComputation = true
  c = new (R.Computation)(f, R.currentComputation, options.onError)
  if R.active
    R.onInvalidate ->
      c.stop()
      return
  c

R.nonreactive = (f) ->
  previous = R.currentComputation
  setCurrentComputation null
  try
    return f()
  finally
    setCurrentComputation previous
  return

R.onInvalidate = (f) ->
  if !R.active
    throw new Error('Reactive.onInvalidate requires a currentComputation')
  R.currentComputation.onInvalidate f
  return

R.afterFlush = (f) ->
  afterFlushCallbacks.push f
  requireFlush()
  return

# REACTIVE UTILITIES AND SOURCES:

# Various useful constructors for reactive sources.

# TODO: capitalize constructors
# Variable
R.var = (value=undefined) ->
  dep = new R.Dependency
  return {
    dep: dep,
    set: (v) -> (value = v; dep.changed()) if v != value
    get:     -> (dep.depend(); value)
  }

# Dictionary
R.dict = (vals={}) ->
  deps = {}
  return {
    dep: dep,
    set: (name, val) ->
      if vals[name] != val
        deps[name] ||= new R.Dependency
        deps[name].changed()
        vals[name] = val
    get: (name) ->
      deps[name] ||= new R.Dependency
      deps[name].depend()
      vals[name]
  }

# Ticker (Timer)
R.ticker = (interval=1000) ->
  dep     = new R.Dependency
  counter = 0
  cb = -> (counter += 1; dep.changed())
  timer = window.setInterval cb, interval
  return {
    dep: dep
    get: -> (dep.depend(); counter)
    stop: -> window.clearInterval timer
  }

R.queue = ->
  dep   = new R.Dependency
  queue = []
  return {
    dep: dep
    put: (e) -> (queue.unshift(e); dep.changed())
    get: ->
      dep.depend()
      res = queue
      queue = []
      return res
  }

do -> # Wraps dom events to provide $events: domEvent
  _domEvents = (useCapture, args...) ->
    dep      = new R.Dependency
    curEvent = undefined
    curKind  = undefined

    mkHandler = (kind) -> return (event) ->
      curEvent = event
      curKind  = kind
      dep.changed()

    handlers    = {}
    handlers[a] = mkHandler a for a in args

    return {
      handlers: handlers
      kind:  -> (dep.depend(); curKind)
      event: -> (dep.depend(); curEvent)
    }

  R.domEvents        = -> _domEvents false, arguments...
  R.captureDomEvents = -> _domEvents true,  arguments...

R.alerts = ->
  dep = new R.Dependency
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


module.exports = R

