
{
  $, IntervalTimer, Persist, localStorage, SerializeTo,
  mount,
  cond, dynamic, component, tag, text, dom,
  div, strong, ul, li, input, button, hr, span,
  h1, h2, h3, h4, p, a
} = require "../src/zodiac"


state  = $(0)
ticker = $(0)
timer  = IntervalTimer(50, ticker.inc)

  # // state.persistence =
  # //   Persist(
  # //     SerializeTo(
  # //       localStorage("state")));

Tabs = (selection, tabs) ->
  lis = Object.keys(tabs).map (k) ->
    li ".nav-item",
      a ".nav-link", {
          role: "button"
          ".active": -> selection.get() == k
          $click: () -> selection.set(k)
        },
        k

  return div {},
    ul ".nav.nav-tabs", {style: "margin: 3em 0"},
      lis...
    dynamic -> tabs[selection.get()]

HelloWorld = require "../examples/HelloWorld.js"
DomSyntax = require "../examples/DomSyntax.js"
MultipleCounters = require "../examples/MultipleCounters.js"
SimpleTodos = require "../examples/SimpleTodos.coffee"

ExampleTabs = ->
  Tabs($("SimpleTodos"), {
    HelloWorld,
    DomSyntax,
    MultipleCounters,
    SimpleTodos
  })

App = ->
  div ".container",
    hr()
    h1 "Dev Playground"
    hr()
    ExampleTabs()

mount document.body, App()



