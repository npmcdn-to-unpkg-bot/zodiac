
# This is Meteor Tracker, ripped from the Meteor platform, converted to
# coffee, trimmed and slightly rewritten.

Tracker = 
  active:             false
  currentComputation: null
  _computations:      {}

setCurrentComputation = (c) ->
  Tracker.currentComputation = c
  Tracker.active = !!c
  return

_throwOrLog = (from, e) ->
  throw e if throwFirstError
  printArgs = [ 'Exception from Tracker ' + from + ' function:' ]
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
    setTimeout Tracker._runFlush, 0
    willFlush = true
  return

constructingComputation = false

Tracker.Computation = (f, parent, onError) ->
  if !constructingComputation
    throw new Error('Tracker.Computation constructor is private; use Tracker.autorun')
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
  Tracker._computations[self._id] = self
  errored = true
  try
    self._compute()
    errored = false
  finally
    self.firstRun = false
    if errored
      self.stop()
  return

Tracker.Computation::onInvalidate = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onInvalidate requires a function')
  if self.invalidated
    Tracker.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onInvalidateCallbacks.push f
  return

Tracker.Computation::onStop = (f) ->
  self = this
  if typeof f != 'function'
    throw new Error('onStop requires a function')
  if self.stopped
    Tracker.nonreactive ->
      withNoYieldsAllowed(f) self
      return
  else
    self._onStopCallbacks.push f
  return

Tracker.Computation::invalidate = ->
  self = this
  if !self.invalidated
    if !self._recomputing and !self.stopped
      requireFlush()
      pendingComputations.push this
    self.invalidated = true
    i = 0
    f = undefined
    while f = self._onInvalidateCallbacks[i]
      Tracker.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onInvalidateCallbacks = []
  return

Tracker.Computation::stop = ->
  self = this
  if !self.stopped
    self.stopped = true
    self.invalidate()
    delete Tracker._computations[self._id]
    i = 0
    f = undefined
    while f = self._onStopCallbacks[i]
      Tracker.nonreactive ->
        withNoYieldsAllowed(f) self
        return
      i++
    self._onStopCallbacks = []
  return

Tracker.Computation::_compute = ->
  self                  = this
  self.invalidated      = false
  previous              = Tracker.currentComputation
  setCurrentComputation self
  previousInCompute     = inCompute
  inCompute             = true
  try
    withNoYieldsAllowed(self._func) self
  finally
    setCurrentComputation previous
    inCompute = previousInCompute
  return

Tracker.Computation::_needsRecompute = ->
  self = this
  self.invalidated and !self.stopped

Tracker.Computation::_recompute = ->
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

Tracker.Dependency = ->
  @_dependentsById = {}
  return

Tracker.Dependency::depend = (computation) ->
  if !computation
    if !Tracker.active
      return false
    computation = Tracker.currentComputation
  self = this
  id = computation._id
  if !(id of self._dependentsById)
    self._dependentsById[id] = computation
    computation.onInvalidate ->
      delete self._dependentsById[id]
      return
    return true
  false

Tracker.Dependency::changed = ->
  self = this
  for id of self._dependentsById
    self._dependentsById[id].invalidate()
  return

Tracker.Dependency::hasDependents = ->
  self = this
  for id of self._dependentsById
    return true
  false

Tracker.flush = (options) ->
  Tracker._runFlush
    finishSynchronously: true
    throwFirstError: options and options._throwFirstError
  return

Tracker._runFlush = (options) ->
  throw new Error('Can\'t call Tracker.flush while flushing') if inFlush
  throw new Error('Can\'t flush inside Tracker.autorun') if inCompute
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
      Tracker._runFlush
        finishSynchronously: options.finishSynchronously
        throwFirstError: false
    willFlush = false
    inFlush = false
    if pendingComputations.length or afterFlushCallbacks.length
      if options.finishSynchronously
        throw new Error('still have more to do?')
      setTimeout requireFlush, 10
  return

Tracker.autorun = (f, options) ->
  if typeof f != 'function'
    throw new Error('Tracker.autorun requires a function argument')
  options = options or {}
  constructingComputation = true
  c = new (Tracker.Computation)(f, Tracker.currentComputation, options.onError)
  if Tracker.active
    Tracker.onInvalidate ->
      c.stop()
      return
  c

Tracker.nonreactive = (f) ->
  previous = Tracker.currentComputation
  setCurrentComputation null
  try
    return f()
  finally
    setCurrentComputation previous
  return

Tracker.onInvalidate = (f) ->
  if !Tracker.active
    throw new Error('Tracker.onInvalidate requires a currentComputation')
  Tracker.currentComputation.onInvalidate f
  return

Tracker.afterFlush = (f) ->
  afterFlushCallbacks.push f
  requireFlush()
  return

Tracker.Var = (value) -> # Same as ReactiveVar
  dep = new Tracker.Dependency
  return {
    dep: dep
    set: (v) -> (value = v; dep.changed()) if v != value
    get:     -> (dep.depend(); value)
  }

module.exports = Tracker
window.Tracker = Tracker if window?