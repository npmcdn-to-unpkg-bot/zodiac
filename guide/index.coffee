
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

require "./index.scss"

state  = $(0)
ticker = $(0)
timer  = IntervalTimer(50, ticker.inc)

  # // state.persistence =
  # //   Persist(
  # //     SerializeTo(
  # //       localStorage("state")));

container = (content...) -> div(".container", content...)
row = (content...) -> div(".row", content...)

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


require('codemirror/mode/javascript/javascript')
require('codemirror/mode/css/css')
require('codemirror/mode/htmlmixed/htmlmixed')

require('codemirror/lib/codemirror.css')
require('codemirror/theme/monokai.css')

CodeMirror = require 'codemirror/lib/codemirror'

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

# TODO: use a patched version of zodiac mount so that document.body
# becomes the example viewer, and other values result in an error
# stating that output is being redirected to the example viewer.
# Also make this mount auto-demount on new calls.

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
        theme:     'monokai'
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

  div ".row", {style: "padding-bottom: 2em"},
    div ".col-xl-8",
      CodeEditor code
    div ".col-xl-4",
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

  div {},
    # Tabs($("SimpleTodos"), {
    #   HelloWorld,
    #   DomSyntax,
    #   MultipleCounters,
    #   SimpleTodos
    # })
    #
    hr()

    Data["guide"]["01_Introduction.md"].map (item) ->
      switch item.type
        when "markup" then div {__activated: (e) ->
          e.target.innerHTML = item.content }
        when "code" then CodeExample $ item.content
        else throw "Unexpected guide content type " + item.type


App = ->
  container "",
    row "",
      column {md: 3},
        hr()

        input ".form-control", {type: "text", placeholder: "Search.."}

        hr()

        ul ".nav.nav-tabs",
          li ".nav-item", a ".nav-link", {href: "#", active: false},
            "Guide"
          li ".nav-item", a ".nav-link", {href: "#", active: false},
            "API"
          li ".nav-item", a ".nav-link", {href: "#", active: false},
            "Examples"

        ol ".index",

          li "Introduction",
            ol {},
              li "Principles"
              li "Justification"
              li "Toolchain"
              li "Examples"

          li "Basics",
            ol {},
              li "Reactivity"
              li "Variables"
              li "Rendering"

          li "Advanced",
            ol {},
              li "Nested variables"
              li "Components"
              li "Code structure"

          li "Recipes",
            ol {},
              li "Routing"
              li "HTTP Resources"
              li "Twitter Bootstrap"

          li "Glossary"
            ol {},
              li "Tracker"
              li "ZVar"
              li "ZDict"
              li "Template" # not virtual dom
              li "Component" # not a class
              li "Router"

          li "API Reference"
            ol {},
              li "Variables"
              li "Templates"
              li "Reactivity"
              li "Router"
              li "Serialization"
              li "Utilities"

      column {md: 9},
        BodyNav()

# CodeExample $ Data["examples"]["HelloWorld.js"]

document.addEventListener "DOMContentLoaded", (event)  ->
  mount document.body, App()



