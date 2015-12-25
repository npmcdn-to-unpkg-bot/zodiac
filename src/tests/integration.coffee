
Zodiac = require '../zodiac'

class ReactiveTicker
  constructor: (@interval=1000) ->
    @dep     = new Zodiac.Tracker.Dependency
    @counter = 0
    cb = =>
      @counter += 1
      @dep.changed()
    @timer = window.setInterval cb, @interval

  get: =>
    @dep.depend()
    @counter

hello = -> console.log "hello"

Components = {}
Components.Welcome = Zodiac.component
  template: div {class: 'wrapper'},
    div {class: "container"},
      p $click: hello, "Click me and check console."
      # TODO: don't evaluate event handlers automatically..
      # extract them, and add event listeners as per SO
  init: (scope) -> console.log 'component initialized'

ticker = new ReactiveTicker

Examples = 
  a: Z ul li('simple list')
  b: Z div {class: 'funky', 'data-id': ticker.get},
    p {class: ticker.get}, 'List with ticker:'
    ul {},
      li 'first element'
      li {},
        ticker.get
        span ' ..'   # TODO: v is referenced after reset. clone scopes.
    ul _for 'v', [1,2,3], li -> @v() + ticker.get()
    footer {}, p 'Footer after the list.' # TODO: not properly destroyed.

  c: Z p _if (-> ticker.get() % 2 == 0), (-> ticker.get()), _else, 'no'
  d: Z p {},
    _unless (-> ticker.get() % 3 != 0),
      span -> ticker.get()
      _else
      'nope'

window.integrationExamples = Examples if window?

exports.run = ->

window.run = ->
  console.log 'integration'
  #a = Zodiac.render Examples.a
  # a.stop()
  # b = Zodiac.render Examples.b
  #b.stop()
  c = Zodiac.render Examples.c
  d = Zodiac.render Examples.d
  e = Zodiac.render Components.Welcome
  return stop: ->
    x.stop() for x in [a, b, c, d, e]
    null


