const { sync: glob } = require("glob");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
module.exports = {
  prelink: (path = process.cwd()) => {
    //Update a couple of key files.
    //Look for the
    const sgPath = join(path, "android", "settings.gradle");
    if (existsSync(sgPath)) {
      const text = readFileSync(sgPath, { encoding: "utf8" });
      const newText =
        "project(':react-native-code-push').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-code-push/android/app')";
      if (!text.includes(newText)) {
        writeFileSync(sgPath, [text, newText].join("\n"));
      }
    }
    const bgPath = join(path, "android", "app", "build.gradle");
    if (existsSync(bgPath)) {
      const bgText = readFileSync(bgPath, { encoding: "utf8" });
      const referenceText =
        "\n" + 'apply from: "../../node_modules/react-native/react.gradle"';
      const bgNewText =
        'apply from: "../../node_modules/react-native-code-push/android/codepush.gradle"';
      if (!bgText.includes(bgNewText)) {
        writeFileSync(
          bgPath,
          bgText.replace(referenceText, [referenceText, bgNewText].join("\n"))
        );
      }
    }
  },
};
