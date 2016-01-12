
Z.Sheets =
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
    return if Z.Sheets.initialized?
    Z.Sheets.initialized = true
    for name in Z.Sheets.levels
      Z.Sheets[name] = Z.Sheets.tag "/* #{name} */"
    null

class Z.Sheets.Sheet
  constructor: (@name, @groups) ->
    @active = false

  activate: () ->
    return if @active
    @active = true
    for level, styles of @groups
      for selector, rules of styles
        unless Z.Sheets[level]?
          throw "invalid level #{level} or coffee sheets not initialized"
        Z.Sheets[level].push "/* #{@name} */"
        Z.Sheets[level].push "#{selector} {"
        for prop, val of rules
          prop = prop.replace '_', '-'
          Z.Sheets[level].push "#{prop}: #{val};"
        Z.Sheets[level].push "}"
    null

Z.Sheets.create = -> new Z.Sheets.Sheet arguments...

document.addEventListener "DOMContentLoaded", -> Z.Sheets.init()
