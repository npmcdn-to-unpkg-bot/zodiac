
import { mount } from "zodiac";

import RootStore from "./store/RootStore";
import RootModel from "./models/RootModel";
import RootView  from "./views/App";

const store    = RootStore();
const model    = RootModel(store);
const view     = RootView(model);
const instance = mount(document.body, view);

window.instance = instance; // Just to make debugging easier