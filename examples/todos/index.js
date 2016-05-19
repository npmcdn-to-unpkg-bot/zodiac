
import { mount } from "zodiac";

import createStore from "./store/createStore";
import Model from "./models/RootModel";
import View  from "./views/App";

const
  store    = createStore(),
  model    = Model(store),
  view     = View(model),
  instance = mount(document.body, view);

window.instance = instance; // Just to make debugging easier
