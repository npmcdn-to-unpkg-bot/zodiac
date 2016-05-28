{
  $, IntervalTimer, Persist, localStorage, SerializeTo, autorun,
  mount,
  cond, dynamic, component, tag, text, dom,
  div, strong, ul, li, input, button, hr, span,
  h1, h2, h3, h4, p, a, label, small, mark
} = require "../src/zodiac"

# Data model:

todos = $([
  {
    name: $("Create Zodiac")
    completed: $(true)
  }
])

visibilityFilter = $("all")

# Data views:

filteredTodos = (filter) ->
  todos.get().filter (todo) ->
    switch filter
      when "all" then true
      when "active" then !todo.completed.get()
      when "completed" then todo.completed.get()
      else throw new Error "invalid filter: "+ filter

visibleTodos = -> filteredTodos visibilityFilter.get()

# Components:

TextEnterInput = (classes, {value, placeholder, $submit, $blur=->}) ->
  input classes, {
    __activated: (ev) -> ev.target.select()
    type: "text"
    value: value.get
    placeholder
    $input: (ev) -> value.set(ev.target.value)
    $keyup: (ev) -> $submit() if ev.keyCode == 13
    $blur
  }

TodoCreator = ->
  value = $("")
  div {style: "margin-bottom: 1em"},
    TextEnterInput ".form-control", {
      value
      placeholder: "Create todo.."
      $submit: ->
        todos.unshift {
          name: $(value.get())
          completed: $(false)
        }
        value.set("")
    }

InlineEditable = (value, placeholder) ->
  editing = $(false)

  readableValue = ->
    if value.get().length > 0 then value.get() else "(no name)"

  cond editing.get,
    TextEnterInput ".edit", {
      value
      placeholder
      $submit: -> editing.set(false)
      $blur: -> editing.set(false)
    }
    span { $click: -> editing.set(true) },
      readableValue

TodoCheckbox = (completed) ->
  input {
    type: "checkbox"
    checked: completed.get
    $click: completed.toggle
  }

Todo = (todo) ->
  {name, completed} = todo
  li { role: "button", ".text-muted": completed.get },
    TodoCheckbox completed
    " "
    InlineEditable name, "New name..."
    " "
    a { $click: -> todos.drop todo }, "delete"

ItemCount = ->
  -> switch visibleTodos().length
    when 0 then "nothing"
    when 1 then "1 item"
    else visibleTodos().length + " items"

Deletor = ->
  cond (-> visibleTodos().length > 0),
    a {
        role: "button"
        $click: ->
          visibleTodos().forEach todos.drop
      },
      "Delete ", visibilityFilter.get, " items"

VisibilityLink = (name) ->
  span {
      role: "button"
      $click: -> visibilityFilter.set(name)
    },
    cond (-> visibilityFilter.get() == name),
      mark name
      span ".text-muted", name

FilterSelector = ->
  p "Show: ",
    VisibilityLink("all"),       " "
    VisibilityLink("active"),    " "
    VisibilityLink("completed"), " "
    span ".text-muted",
      "(", ItemCount(), ") "
      Deletor()

App = ->
  return div {style: "width: 30em"},
    FilterSelector()
    TodoCreator()
    ul dynamic(visibleTodos, Todo)

module.exports = App()
