
import {
  $, follow,
  targetValue, ifEnter,
  dom, cond, loop,
  span, h1, p, a, ul, li, input
} from "zodiac";

function TodoCreator(todos) {
  const value = $("");

  function $input(e) { value.set(e.value); }

  function $keyup(e) {
    if (e.keyCode !== 13) return;
    todos.create(e.value);
    value.set("");
  }

  return input({
    type: 'text',
    $input,
    $keyup,
    value: [value.get],
    placeholder: "Create todo..."
  });
}

function QuickInput({value, placeholder, $submit, $blur}) {
  return input({
    __activated: (ev) => ev.target.select(), // autofocus on input
    value: [value.get],
    $input: targetValue(value.set),
    $keyup: ifEnter($submit),
    $blur
  });
}

function ClickToEdit({$submit, Editor, View}) {
  const editing = $(false);

  return cond(editing.get,
    Editor({
      $submit: () => {
        editing.set(false);
        $submit();
      },
      $blur: () => editing.set(false)
    }),
    View({
      $click: () => editing.set(true)
    })
  );
}

function ClickToEditTodoName({item}) {
  const value = follow(item.name.get);

  function onSubmit() {
    item.name.set(value.get())
  }

  function Editor({$submit, $blur}) {
    return QuickInput({
      placeholder: "New item...",
      value, $submit, $blur
    });
  }

  function View({$click}) {
    return span({
      $click,
      "class": [() => item.checked.get() && "checked"]
    }, [() => item.label()]);
  }

  return ClickToEdit({Editor, View, onSubmit});
}

function TodoItem(item) {

  function onDeleteClick(e) { item.destroy(); }

  return li(
    input({
      type: "checkbox",
      checked: [() => item.checked.get()],
      $click: () => item.checked.toggle
    }),
    ClickToEditTodoName({item}),
    " ",
    a({
      href: "#",
      $click: onDeleteClick},
      "[Delete]"
    )
  );
}

function TodoList(list) {
  return ul(
    loop(list.items, TodoItem)
  );
}

function Todos(todos) {
  return dom(
    h1("Another amazing todo-list"),
    TodoList(todos),
    TodoCreator(todos),
    p(
      a({
        href: "#",
        $click: () => todos.destroyCompleted()
        },
        "Remove completed")
    )
  );
}

function App(model) {
  return Todos(model.todos);
}

export default App;
