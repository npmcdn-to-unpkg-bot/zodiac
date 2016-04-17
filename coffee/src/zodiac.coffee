module.exports =
  # Node:     require "./zodiac/node"
  Reactive: require "./zodiac/reactive"
  Router:   require './zodiac/router'
  Template: require "./zodiac/template"
  render:   require "./zodiac/render"

  # Reactive: Computational dependency tracker
  # Router:   A router based on Reactive and html pushState
  # Template: The template dsl used to create template ASTs
  # render:   The reactive function that renders a template

  # The render function sets up a reactive computation that
  # will update itself and the dom whenever its reactive
  # dependencies change. It will not update locally, so
  # that the entire tree is not re-rendered for every change.
