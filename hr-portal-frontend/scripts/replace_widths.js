import fs from "fs";
import path from "path";

const srcDir =
  "/Users/aryanshah/Developer/Security/hr-portal-web/hr-portal-frontend/src/pages";

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".tsx")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      let originalContent = content;

      content = content.replace(
        /maxWidth:\s*"(?:28|32|42|48|52|56|64|72)rem"/g,
        'maxWidth: "90rem"',
      );

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
console.log("Done.");
