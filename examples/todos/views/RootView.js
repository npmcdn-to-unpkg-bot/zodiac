
import z from "zodiac";

const {
  dom, cond, loop,
  span, h1, p, a, ul, li, input
} = z.template;

function TodoCreator(actions) {
  const text = z.str("");

  function inputEv(e) { text.set(e.value); }

  function keyEv(e) {
    if (e.keyCode != 13) return;
    actions.create(e.value);
    text$.set("");
  }

  return input({
    type: 'text',
    $input: inputEv,
    $keyPress: keyEv,
    value: text,
    placeholder: "Create todo..."
  });
}

function TodoItem(item) {
  const editing = z.bool(false);

  function deleteClickEv(e) { item.destroy(); }
  function textClickEv(e)   { editing.toggle(); }
  function inputBlurEv(e)   { editing.toggle(); }
  function keyupEv(e)       { if (e.keyCode == 13) editing.toggle(); }
  function inputEv(e)       { item.setName(e.target.value); }

  function labelText() {
    let text = item.getText();
    return text.length > 0 ? text : "(unnamed todo)";
  }

  const todoTextInput = input({
    type: "text",
    __activated: (ev) => ev.target.select(), // focus on render
    value: [item.text.get],
    $keyup: keyupEv,
    $blur:  inputBlurEv,
    $input: inputEv
  });

  return li(
    input({
      type: "checkbox",
      checked: [item.checked.get],
      $click: item.checked.toggle
    }),

    cond(editing.get,
      todoTextInput,
      span({
        $click: textClickEv,
        "class": [() => item.checked.get() && "checked"]
      },
        [labelText]
      )),
    " ",
    a({
      href: "#",
      $click: deleteClickEv},
      "[Delete]"
    )
  );
}

function TodoList(list) {
  return ul(
    loop(list.items, TodoItem)
  );
}

function RootView(model) {
  return dom(
    h1("Another amazing todo-list"),
    TodoList(model.todoList),
    TodoCreator(model.todoList),
    p(
      a({
        href: "#",
        $click: () => model.destroyCompleted()
        },
        "Remove completed")
    )
  );
}

export default RootView;