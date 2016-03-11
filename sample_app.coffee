App =
  Router:     new Zodiac.Router
  Alerts:     new Zodiac.Alerts
  Components: {}
  Models:     {}
  State:      {}

document.addEventListener "DOMContentLoaded", ->
  App.Sheets.initialize()
  # clear body html loading screen
  App.Compontents.Root.render()


# TODO: use webpack to build
