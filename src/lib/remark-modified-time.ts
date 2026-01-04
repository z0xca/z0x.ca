import { execSync } from "child_process";

export function remarkModifiedTime() {
  return function (tree, file) {
    const filepath = file.history[0];
    const result = execSync(`git log -1 --pretty="format:%cI %H" "${filepath}"`);
    const output = result.toString().trim();
    if (output) {
      const [date, commit] = output.split(" ");
      file.data.astro.frontmatter.lastModified = date;
      file.data.astro.frontmatter.lastModifiedCommit = commit;
    }
  };
}