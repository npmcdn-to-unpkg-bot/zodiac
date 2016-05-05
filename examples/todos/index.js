
import z from "zodiac";

import RootStore from "./store/RootStore";
import RootModel from "./models/RootModel";
import RootView  from "./views/App";

const store    = RootStore();
const model    = RootModel(store);
const view     = RootView(model);
const instance = z.mount(document.body, view); // TODO: switch order, maybe different syntax

// persist(Store, toLocalStorage); // TODO
// TODO recursive dump & load

// TODO: react hot reloader?

instance.toggle(); // TODO: should not be necessary.

// For debugging:
window.instance = instance();
