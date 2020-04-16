const xml2js = require("xml2js");
const { join } = require("path");
const { sync: glob } = require("glob");
const { spawnSync } = require("child_process");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const Plist = require("plist");
module.exports = {
  advanced: {
    startupClasses: ["RNSCodePush.RNSCodePush"],
    prelink: ({ path = process.cwd() }) => {
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
  },
  commands: [
    {
      name: "set-code-push-key [key]",
      description: "Set codepush key (platform specification required)",
      options: [
        {
          name: "--ios",
          description: "Set for iOS project (this or --android is required",
        },
        {
          name: "--android",
          description: "Set for Android (this or --ios is required)",
        },
        {
          name: "--appName [name]",
          description: "Name of application",
          default: "",
        },
        {
          name: "--stage [stage]",
          description: "Deployment Stage",
          default: "",
        },
      ],
      func: ([key], _, { appName, stage, android, ios }) => {
        if (!android && !ios) {
          console.error(
            "--android or --ios specification is required (set both to use same key on both"
          );
          process.exit(1);
        }
        if (!key) {
          if (!appName) {
            //List appnames
            const { output } = spawnSync(
              "yarn",
              ["-s", "appcenter", "apps", "list", "--output", "json"],
              { stdio: "pipe", encoding: "utf8" }
            );
            const a = JSON.parse(
              [output[0], output[1]].filter(Boolean).join("")
            );
            if (a.length > 1) {
              console.log(
                "Problem: appName not specified - try running with one of these names"
              );
              console.log(
                a
                  .map(
                    ({ name, owner: { name: ownerName } }) =>
                      "\t react-native set-code-push-key " +
                      (ios ? " --ios" : "") +
                      (android ? " --ios" : "") +
                      " --appName " +
                      [ownerName, name].join("/")
                  )
                  .join("\n")
              );
              return;
            } else {
              const {
                name,
                owner: { name: ownerName },
              } = a.pop();
              appName = [ownerName, name].join("/");
            }
          }
          const { output: output2 } = spawnSync(
            "yarn",
            [
              "-s",
              "appcenter",
              "codepush",
              "deployment",
              "list",
              "-k",
              "--app",
              appName,
              "--output",
              "json",
            ],
            { stdio: "pipe", encoding: "utf8" }
          );
          if (!output2) {
            throw "Could not find codepush stages for app " + appName;
          }
          const a2 = JSON.parse(
            [output2[0], output2[1]].filter(Boolean).join("")
          );
          if (stage) {
            const myStage = a2.find(([thisStage, key]) => thisStage === stage);
            if (myStage) {
              key = myStage[1];
            } else {
              throw "This stage does not exist in the app " + appName;
            }
          } else if (a2.length > 1) {
            console.log(
              "Problem: stage not specified, and there is more than one. Try using:"
            );
            console.log(
              a2
                .map(
                  ([stage]) =>
                    "\treact-native set-code-push-key --appName " +
                    appName +
                    " --stage " +
                    stage +
                    (ios ? " --ios" : "") +
                    (android ? " --ios" : "")
                )
                .join("\n")
            );
            return;
          } else {
            const [[, newKey]] = stages;
            key = newKey;
          }
        }
        if (key) {
          if (android) {
            const paths = glob(
              join(
                process.cwd(),
                "android",
                "app",
                "src",
                "main",
                "**",
                "strings.xml"
              )
            );
            paths.forEach(async (path) => {
              const xml = readFileSync(path, { encoding: "utf8" });

              const o = await xml2js.parseStringPromise(xml);
              //look for my keys
              const strings = o.resources.string;
              let myString = strings.find(
                ({ $: { name } }) => name === "CodePushDeploymentKey"
              );
              if (!myString) {
                strings.push({ $: { name: "CodePushDeploymentKey" }, _: key });
              } else {
                myString._ = key;
              }
              const out = new xml2js.Builder().buildObject(o);
              writeFileSync(path, out);
              console.log("Added deployment key", key, "to", path);
            });
          }
          if (ios) {
            const paths = glob(
              join(process.cwd(), "ios", "*", "Info.plist")
            ).filter(
              (path) => !path.includes("/Pods/") && !path.includes("-tvOS")
            );
            paths.forEach((path) => {
              const xml = readFileSync(path, { encoding: "utf8" });
              const o = Plist.parse(xml);
              o.CodePushDeploymentKey = key;
              const out = Plist.build(o);
              writeFileSync(path, out);
              console.log("Added deployment key", key, "to", path);
            });
          }
        }
      },
    },
  ],
};
