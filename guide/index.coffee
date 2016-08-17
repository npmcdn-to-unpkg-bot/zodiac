
{
  $, IntervalTimer, Persist, localStorage, SerializeTo, autorun,
  debounce,
  mount,
  cond, dynamic, component, tag, text, dom,
  div, strong, ul, ol, li, input, button, hr, span, form,
  h1, h2, h3, h4, p, a, textarea, pre
} = require "../src/zodiac"

Data = require "./data.json.js"

# _ = require("lodash")


state  = $(0)
ticker = $(0)
timer  = IntervalTimer(50, ticker.inc)

  # // state.persistence =
  # //   Persist(
  # //     SerializeTo(
  # //       localStorage("state")));


column = (sizing, content...) ->
  classes = Object.keys(sizing).map((breakpoint) ->
    "col-" + breakpoint + "-" + sizing[breakpoint]
  )
  div({class: classes}, content...)

nav = (classes, content...) ->
  ul(classes, content...)

stacked_pills = (props, content...) ->
  nav ".nav-pills.nav-stacked", props, content...

nav_item = (content...) ->
  li ".nav-item", content...

nav_link = (props, args...) ->
  a ".nav-link", props, args...




Tabs = (selection, tabs) ->
  links = Object.keys(tabs).map (k) ->
    a ".nav-item.nav-link", {
        role: "button"
        ".active": -> selection.get() == k
        $click: () -> selection.set(k)
      },
      k

  return div {},
    nav ".navbar.navbar-dark.bg-inverse", {style: "margin: 1em 0"},
      div ".nav.navbar-nav",
        links...
    dynamic -> tabs[selection.get()]

transpile = (sourceCode) ->
  Babel.transform(sourceCode, {
    presets: ['es2015']
    plugins: ["transform-object-rest-spread"]
  }).code

mockRequire = (changes, fn) ->
  oldreq = window.require
  window.require = (name) ->
    switch name
      when "zodiac" then return Object.assign({}, Zodiac, changes)
      else throw new Error("unknown package: " + name)
  fn()
  window.require = oldreq


CodeEditor = (text) ->

  textarea {
    __activated: (e) ->
      editor = CodeMirror.fromTextArea(e.target, {
        mode: 'text/javascript',
        lineWrapping: true,
        extraKeys: {
          'Ctrl-Space': 'autocomplete'
        },
        lineNumbers: true
        viewportMargin: Infinity
        theme:     'ambiance'
      })

      setTimeout editor.refresh.bind(editor), 1

      autorun ->
        newText = text.get()
        if newText != editor.getValue()
          editor.setValue(newText)

        editor.on "change", debounce 1000, (instance, change) ->
          text.set instance.getValue()
  }

CodeExample = (code) ->
  error = $ false
  liveInstance = null

  div ".col-md-6", {style: "padding-bottom: 2em"},
    div {},
      CodeEditor code
    div {},
      cond error.get,
        pre -> error.get().message
        div {
          __activated: (event) ->
            viewerDiv = event.target
            autorun ->
              try
                transpiled = transpile code.get()
                mockRequire(
                  {
                    mount: (target, template) ->
                      if target != document.body
                        throw new Exception("This example code will only let you render to document.body, and the actual output will be redirected to the example canvas. In a real environment, you can change this to whatever element you want, but not in this live example.")
                      if liveInstance
                        liveInstance.toggle()
                        liveInstance = null
                      liveInstance =  Zodiac.mount(viewerDiv, template)
                  }
                  -> window.eval transpiled
                )
                error.set false
              catch e
                error.set e
                throw e
        }
      hr()
      button {
        type: "button"
        $click: code.reset
      }, "Reset example code"

BodyNav = ->

  div ".row",
    # Tabs($("SimpleTodos"), {
    #   HelloWorld,
    #   DomSyntax,
    #   MultipleCounters,
    #   SimpleTodos
    # })
    #
    hr()

    Data["guide/chapters"]["01-README.md"].map (item) ->
      switch item.type
        when "markup" then div ".col-md-6", {__activated: (e) ->
          e.target.innerHTML = item.content }
        when "code" then CodeExample $ item.content
        else throw "Unexpected guide content type " + item.type


App = ->
  div ".container", BodyNav()
    # row "",
    #   column {md: 3},
    #     hr()
    #
    #     input ".form-control", {type: "text", placeholder: "Search.."}
    #
    #     hr()
    #
    #     ul ".nav.nav-tabs",
    #       li ".nav-item", a ".nav-link", {href: "#", active: false},
    #         "Guide"
    #       li ".nav-item", a ".nav-link", {href: "#", active: false},
    #         "API"
    #       li ".nav-item", a ".nav-link", {href: "#", active: false},
    #         "Examples"



# CodeExample $ Data["examples"]["HelloWorld.js"]

document.addEventListener "DOMContentLoaded", (event)  ->
  mount document.body, App()



