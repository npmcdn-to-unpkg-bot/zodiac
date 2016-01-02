
Zodiac = require '../zodiac'


hello = -> console.log "hello"

Components = {}
Components.Welcome = Zodiac.component 'welcome',
  # init_css:       {}
  tags_css:
    body:
      background_color: 'red'
  # classes_css:    {}
  objects_css:    {}
  # overrides_css:  {}
  template: div {class: 'wrapper'},
    div {class: "container"},
      p $click: hello,
        "Click me and check console.",
        a {href: '//s.jostein.be/foo'}, "foo!"
  init:  () -> console.log 'component initialized'
  render: (appendTo, scope) -> console.log 'component rendered to ' + appendTo

ticker = Trax.ticker()

Examples = 
  a: Z.template ul li('simple list')
  b: Z.template div {class: 'funky', 'data-id': ticker.get},
    p {class: ticker.get}, 'List with ticker:'
    ul {},
      li 'first element'
      li {},
        ticker.get
        span ' ..'
    ul _for 'v', [1,2,3], li -> @v() + ticker.get()
    footer {}, p 'Footer after the list.'

  c: Z.template p _if (-> ticker.get() % 2 == 0), (-> ticker.get()), _else, 'no'
  d: Z.template p {},
    _unless (-> ticker.get() % 3 != 0),
      span -> ticker.get()
      _else
      -> 'yo, ' + App.path.pathTokens()

window.integrationExamples = Examples if window?

exports.run = ->

window.run = ->
  console.log 'integration'
  a = Z.render Examples.a
  #a.stop()
  b = Z.render Examples.b
  #b.stop()
  c = Z.render Examples.c
  d = Z.render Examples.d
  e = Z.render Components.Welcome
  return stop: ->
    x.stop() for x in [a, b, c, d, e]
    null




