
const { readdirSync, readFileSync } = require("fs");
const { join } = require("path");
const marked = require('marked');

module.exports = {};

function loadFolder(name) {
  module.exports[name] = {};
  readdirSync(name).forEach((file) => {
    module.exports[name][file] =
      readFileSync(
        join(name, file),
        "utf-8"
      ).replace(/\n$/, '');
  });
}

function loadMdWithExamples(name) {
  module.exports[name] = {};
  readdirSync(name).forEach((file) => {
    module.exports[name][file] =
      readFileSync(join(name, file), "utf-8")
      .replace(/```javascript/g, '```')
      .split("```\n")
      .map((content, i) => ({
        type:     i % 2 == 0 ? "markup"        : "code",
        content: (i % 2 == 0 ? marked(content) : content)
                 .replace(/\n$/, '')
      }));
  });
}

loadFolder("guide/examples");
loadMdWithExamples("guide/chapters");
