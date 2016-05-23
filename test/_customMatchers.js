
module.exports = {
  toHaveFunctions: function (util) {
    return {
      compare: function (actual, expected) {
        var
          pass = true,
          names = [];

          expected.split(" ").forEach(f => {
            if (typeof actual[f] !== "function") {
              pass = false;
              names.push(f);
            }
          });

        return {
          pass,
          message: "expected " + names.join(", ") + " to be there"
        };
      }
    };
  }
}
