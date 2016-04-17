


App.Path.routes
  #$: -> App.Path.redirect "entry"

  _: ->
    @view = "AppView"
  $$badPath: -> @view = "NotFoundView"

  entry:
    $: -> App.Path.redirect ["entry"].concat ['a', 'b', 'c']
    $$tokens: -> @date = @tokens

  settings: -> @showSettings = true
  logout: -> App.Path.redirect []


hello = -> console.log "hello"

hover = Zodiac.Reactive.domEvents 'mouseenter', 'mouseleave'
console.log "hover:"
console.log hover

Z.Reactive.autorun ->
  console.log hover.kind()

Components = {}
Components.Welcome = Zodiac.component 'welcome',
  # init_css:       {}
  tags_css: {}
  # body:
  #   background_color: 'red'
  # classes_css:    {}
  # objects_css:    {}
  # overrides_css:  {}
  template: div {class: 'wrapper'},
    div {class: "container"},
      p $click: hello, $events: hover,
        "Click me and check console."
        hover.kind
        a {href: '//s.jostein.be/foo'}, "foo!"

  init:   () -> console.log 'component initialized'
  render: (appendTo, scope) -> console.log 'component rendered to ' + appendTo

ticker = Z.Reactive.ticker()

Examples = 
  a: Z.template ul li('simple list')

  b: Z.template div {class: 'funky', 'data-id': ticker.get},
    p {class: ticker.get}, 'List with ticker:'
    ul {},
      li 'first element'
      li {},
        ticker.get
        span ' ..'
    ul {},
      _for 'v', (-> [1..ticker.get()]),
        _if (-> (@v() + ticker.get()) % 2 == 0),
          li (-> @v())
    footer {}, p 'Footer after the list.'

  c: Z.template p _if (-> ticker.get() % 2 == 0), (-> ticker.get()), _else, 'no'
  d: Z.template p {},
    _unless (-> ticker.get() % 3 != 0),
      span -> ticker.get()
      _else
      -> 'yo, ' + App.Path.pathTokens()

  # _for constructs:
  e: Z.template _for 'n', [1,2,3,4], hr()
  f: Z.template _for 'n', [1,2,3,4], p -> @n()
  g: Z.template _if (-> true),
    p {class: 'greet'}, 'hello'
    _else
    p {class: 'bye'}, 'bye'

    _for 'n', (-> Session.get('items')),
      p class: 'poop', -> console.log this; @n()
    hr()

    p {},
      'Greetings, '
      span class: 'name', -> Session.get('name')
      '! How is your adventure going?'
      ul {},
        li 'walk out door'
        li 'travel far'
        li 'come home wiser'

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
  e = Z.render Examples.e
  f = Z.render Examples.f
  g = Z.render Examples.g

  component = Z.render Components.Welcome
  return stop: ->
    x.stop() for x in [a, b, c, d, e, f, g, component]
    null


