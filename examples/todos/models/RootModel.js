
function RootModel(store) {
  return {
    todoList: TodoListModel(Store.todos);
  }
}

function TodoListModel(todos) {
  return {
    create: name => todos.push({
      checked: z.bool(false),
      name:    z.str(name)
    })
    // TODO:
    items: () => todos.mapStream(t => TodoModel(t, todos));
    destroyCompleted: () => null; // TODO...
  }
}

function TodoModel(todo, todos) {
  return {
    name:    todo.name, // use spread operator?
    checked: todo.checked,
    destroy: todo => todos.drop(todo);
  }
}

export default RootModel;

