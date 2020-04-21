const { join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const {
  android: { getAppPath, getAndroidPath },
} = require("@raydeck/react-native-utilities");
module.exports = {
  advanced: {
    startupClasses: ["RNSCodePush.RNSCodePush"],
    prelink: ({ path = process.cwd() }) => {
      const sgPath = join(getAndroidPath(path), "settings.gradle");
      if (!existsSync(sgPath))
        this.throw("No settings.gradle found at ", sgPath);
      const text = readFileSync(sgPath, { encoding: "utf8" });
      const newText =
        "project(':react-native-code-push').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-code-push/android/app')";
      if (!text.includes(newText)) {
        writeFileSync(sgPath, [text, newText].join("\n"));
      }
      const bgPath = join(getAppPath(path), "build.gradle");
      if (!existsSync(bgPath)) throw ("No build gradle found at ", bgPath);
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
    },
  },
};
