

const {list, bool, str} = z.types;

export default {
  todos: list([
    {
      checked:  bool(false),
      name:     str("Make Zodiac")
    }
  ])
};

// persist(Store, toLocalStorage); // TODO
// TODO recursive dump & load
