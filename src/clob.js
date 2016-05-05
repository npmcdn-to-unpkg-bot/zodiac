
// Short for Closure Object. An alternative classes implementation.

// Used to define classes where the methods are created on the instance, and not the prototype, closing over the instance as "self". This is to avoid the effects of rebinding, for instance so that object methods can be passed as parameters.


// mixins and class construction
// class name
// initializers _init
// class methods $methodName



function Clob(name, ...methodList) {
  const methods = {};
  return function (...args) {
    const
      self = new name(...args),
      initializers = [],
      $ = {}, // class methods
      active = true;
    for (var methods of methodList)
      (function (methods) {
        for (let key of Object.keys(methods))
          if (key == "_init") {
            initializers.push(methods["_init"]);
          }
          else if ((key).charAt(0) == "$") {
            $[key.slice(1)] = methods[key];
          }
          else {
            self[key] = function(...args) {
              return methods[key](self, ...args);
            }
          }
      })(methods);
    self.$ = $;
    for (let _init of initializers)
      _init(self, ...args);
    return self;
  }
}

module.exports = Clob;
