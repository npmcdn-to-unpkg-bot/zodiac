
import z from "zodiac";

const {
  dom, cond, loop,
  span, h1, p, a, ul, li, input
} = z.template;

function TodoCreator(actions) {
  const value = z.str("");

  function $input(e) { text.set(e.value); }

  function $keyPress(e) {
    if (e.keyCode !== 13) return;
    actions.create(e.value);
    text$.set("");
  }

  return input({
    type: 'text',
    $input,
    $keyPress,
    value,
    placeholder: "Create todo..."
  });
}

function QuickInput({value, placeholder, $submit, $blur}) {
  return input({
    __activated: (ev) => ev.target.select(), // autofocus on input
    value: [value.get],
    $input: $.targetValue(value.set),
    $keyup: $.ifEnter($submit),
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
  const value = z.follow(item.getName);

  function onSubmit() {
    item.setName(value.get())
  }

  function Editor({$submit, $blur}) {
    return QuickInput({
      placeholder: "New item..."
      value, $submit, $blur
    });
  }

  function View({$click}) {
    return span({
      $click,
      "class": [() => item.checked.get() && "checked"]
    }, [item.label]);
  }

  return ClickToEdit({Editor, View, onSubmit});
}

function TodoItem(item) {

  function onDeleteClick(e) { item.destroy(); }

  return li(
    input({
      type: "checkbox",
      checked: [item.checked.get],
      $click: item.checked.toggle
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