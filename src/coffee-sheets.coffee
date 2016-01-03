
CoffeeSheets =
  levels: 'init tags classes objects overrides'.split ' '
  tag: (rule) ->
    elm = document.createElement 'style'
    elm.setAttribute 'type', 'text/css'
    document.head.appendChild elm
    push = (rules) ->
      if elm.styleSheet # IE
        elm.styleSheet.cssText += rules
      else # rest
        elm.appendChild document.createTextNode(rules)
    push rule
    return push: push

  init: (names...) ->
    return if CoffeeSheets.initialized?
    CoffeeSheets.initialized = true
    for name in CoffeeSheets.levels
      CoffeeSheets[name] = CoffeeSheets.tag "/* #{name} */"
    null

class CoffeeSheets.Sheet
  constructor: (@name, @groups) ->
    @active = false

  activate: () ->
    return if @active
    @active = true
    for level, styles of @groups
      for selector, rules of styles
        unless CoffeeSheets[level]?
          throw "invalid level #{level} or coffee sheets not initialized"
        CoffeeSheets[level].push "/* #{@name} */"
        CoffeeSheets[level].push "#{selector} {"
        for prop, val of rules
          prop = prop.replace '_', '-'
          CoffeeSheets[level].push "#{prop}: #{val};"
        CoffeeSheets[level].push "}"
    null

CoffeeSheets.create = -> new CoffeeSheets.Sheet arguments...

if window?
  window.addEventListener "DOMContentLoaded", ->
    CoffeeSheets.init()

module.exports = CoffeeSheets
