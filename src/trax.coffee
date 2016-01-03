
# This is Meteor Tracker, ripped from the Meteor platform, converted to
# coffee, trimmed and slightly rewritten.

Trax =
  active:             false
  currentComputation: null
  _computations:      {}

setCurrentComputation = (c) ->
  Trax.currentComputation = c
  Trax.active = !!c
  return

_throwOrLog = (from, e) ->
  throw e if throwFirstError
  printArgs = [ 'Exception from Trax ' + from + ' function:' ]
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
    setTimeout Trax._runFlush, 0
    willFlush = true
  return

constructingComputation = false

Trax.Computation = (f, parent, onError) ->
  if !constructingComputation
    throw new Error('Trax.Computation constructor is private; use Trax.autorun')
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
  Trax._computations[self._id] = self
  errored = true
  try
    self._compute()
    errored = false
  finally
    self.firstRun = false
    if errored
      self.stop()
  return

Trax.Computation::onInvalidate = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onInvalidate requires a function')
  if self.invalidated
    Trax.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onInvalidateCallbacks.push f
  return

Trax.Computation::onStop = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onStop requires a function')
  if self.stopped
    Trax.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onStopCallbacks.push f
  return

Trax.Computation::invalidate = ->
  self = this
  if !self.invalidated
    if !self._recomputing and !self.stopped
      requireFlush()
      pendingComputations.push this
    self.invalidated = true
    i = 0
    f = undefined
    while f = self._onInvalidateCallbacks[i]
      Trax.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onInvalidateCallbacks = []
  return

Trax.Computation::stop = ->
  self = this
  if !self.stopped
    self.stopped = true
    self.invalidate()
    delete Trax._computations[self._id]
    i = 0
    f = undefined
    while f = self._onStopCallbacks[i]
      Trax.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onStopCallbacks = []
  return

Trax.Computation::_compute = ->
  self                  = this
  self.invalidated      = false
  previous              = Trax.currentComputation
  setCurrentComputation self
  previousInCompute     = inCompute
  inCompute             = true
  try
    withNoYieldsAllowed(self._func) self
  finally
    setCurrentComputation previous
    inCompute = previousInCompute
  return

Trax.Computation::_needsRecompute = ->
  self = this
  self.invalidated and !self.stopped

Trax.Computation::_recompute = ->
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

Trax.Dependency = ->
  @_dependentsById = {}
  return

Trax.Dependency::depend = (computation) ->
  if !computation
    if !Trax.active
      return false
    computation = Trax.currentComputation
  self = this
  id = computation._id
  if !(id of self._dependentsById)
    self._dependentsById[id] = computation
    computation.onInvalidate ->
      delete self._dependentsById[id]
      return
    return true
  false

Trax.Dependency::changed = ->
  self = this
  for id of self._dependentsById
    self._dependentsById[id].invalidate()
  return

Trax.Dependency::hasDependents = ->
  self = this
  for id of self._dependentsById
    return true
  false

Trax.flush = (options) ->
  Trax._runFlush
    finishSynchronously: true
    throwFirstError: options and options._throwFirstError
  return

Trax._runFlush = (options) ->
  throw new Error('Can\'t call Trax.flush while flushing') if inFlush
  throw new Error('Can\'t flush inside Trax.autorun') if inCompute
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
      Trax._runFlush
        finishSynchronously: options.finishSynchronously
        throwFirstError: false
    willFlush = false
    inFlush = false
    if pendingComputations.length or afterFlushCallbacks.length
      if options.finishSynchronously
        throw new Error('still have more to do?')
      setTimeout requireFlush, 10
  return

Trax.autorun = (f, options) ->
  if typeof f != 'function'
    throw new Error('Trax.autorun requires a function argument')
  options = options or {}
  constructingComputation = true
  c = new (Trax.Computation)(f, Trax.currentComputation, options.onError)
  if Trax.active
    Trax.onInvalidate ->
      c.stop()
      return
  c

Trax.nonreactive = (f) ->
  previous = Trax.currentComputation
  setCurrentComputation null
  try
    return f()
  finally
    setCurrentComputation previous
  return

Trax.onInvalidate = (f) ->
  if !Trax.active
    throw new Error('Trax.onInvalidate requires a currentComputation')
  Trax.currentComputation.onInvalidate f
  return

Trax.afterFlush = (f) ->
  afterFlushCallbacks.push f
  requireFlush()
  return

# Reactivity sources:

# Variable
Trax.var = (value=undefined) ->
  dep = new Trax.Dependency
  return {
    dep: dep,
    set: (v) -> (value = v; dep.changed()) if v != value
    get:     -> (dep.depend(); value)
  }

# Dictionary
Trax.dict = (vals={}) ->
  deps = {}
  return {
    dep: dep,
    set: (name, val) ->
      if vals[name] != val
        deps[name] ||= new Trax.Dependency
        deps[name].changed()
        vals[name] = val
    get: (name) ->
      deps[name] ||= new Trax.Dependency
      deps[name].depend()
      vals[name]
  }

# Ticker (Timer)
Trax.ticker = (interval=1000) ->
  dep     = new Trax.Dependency
  counter = 0
  cb = -> (counter += 1; dep.changed())
  timer = window.setInterval cb, interval
  return {
    dep: dep
    get: -> (dep.depend(); counter)
    stop: -> window.clearInterval timer
  }

Trax.queue = ->
  dep   = new Trax.Dependency
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

module.exports = Trax
window.Trax = Trax if window?
