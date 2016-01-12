
require './zodiac'

Unit        = require './tests/unit'
Integration = require './tests/integration'

document.addEventListener "DOMContentLoaded", ->
  Unit.run()
  Integration.run()
