const
  {autorun} = require("./tracker"),
  {$} = require("./variables");

// Provides saving, reloading and save state tracking of a reactive variable given a getter and a setter to persist and load the state.
//  Note that the Persister will not mark the item changed until the tracker has flushed. you have to flush before checking for changes. This is usually not a problem in practice as long as the architecture is good.
export function Persist(state, {load, save}) {
  let saved = $(false);
  state.set(load());

  autorun(() => {
    state.depend();
    saved.set(false);
  });

  saved.set(true);

  return {
    save: () => {
      save(state);
      saved.set(true);
    },
    reload: () => state.set(load()),
    saved
  };
}

// localStorage adapter that can be used with Persist
export function LocalStorage(key) {
  return {
    load: () => {
      const val = localStorage.getItem(key);
      return val === undefined ? undefined : JSON.parse(val);
    },

    save: (state) =>
      localStorage.setItem(key,
        JSON.stringify(state))
  };
}

function _is(obj, kind) {
  let toString = Object.prototype.toString;
  return toString.call(obj) === ["[object ", kind, "]"].join("");
}

export function deserialize(val) {
  if (val == "__$isZUNDEF")
    return undefined;
  if (val.__$isZV === 1)
    return $(deserialize(val.v))
  else if (_is(val, "Array"))
    return val.map(deserialize)
  else if (val.constructor === Object) {
    const result = {};
    Object.keys(val).forEach(k =>
      result[k] = deserialize(val[k])
    )
    return result;
  }
  else return val;
}

export function dump(val) {
  if (val == undefined)
    return "__$isZUNDEF";
  if (val.constructor.name === "ZVar")
    return {
      __$isZV: 1,
      v: dump(val.get())
    }
  else if (_is(val, "Array"))
    return val.map(dump)
  else if (val.constructor === Object) {
    const result = {};
    Object.keys(val).forEach(k =>
      result[k] = dump(val[k])
    )
    return result;
  }
  else return val;
}

// Serializer that can wrap a reactive variable in order
// to convert its underlying structure to valid JSON.

export function SerializeTo({load, save}) {
  return {
    load: () => deserialize(load()),
    save: (val) => save(dump(val))
  };
}
