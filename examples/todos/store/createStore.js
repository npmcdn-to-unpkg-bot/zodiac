

import{
  $
} from "zodiac";

export default function() {
  return {
    todos: $([
      {
        checked:  $(false),
        name:     $("Make Zodiac")
      }
    ])
  };
}

// persist(Store, toLocalStorage); // TODO
// TODO recursive dump & load
