
function RootModel(state) {
  return {
    todos: TodosModel(state.todos);
  }
}

function TodosModel(todos) {
  return {
    create: name => todos.push({
      checked: z.bool(false),
      name: z.str(name)
    })

    items: () =>
      todos.get().map(t => TodoModel(t, todos)),

    destroyCompleted: () =>
      null // TODO...
  })
}

function TodoModel(todo, todos) {
  return {
    name: todo.name,
    label: () => {
      const text = todo.name.get();
      return text.length > 0 ? text : "(unnamed todo)";
    }
    checked: todo.checked,
    destroy: todo => todos.drop(todo)

  }
}

export default RootModel;