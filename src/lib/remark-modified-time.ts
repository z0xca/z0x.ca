import { execSync } from "child_process";
import path from "path";

export function remarkModifiedTime() {
  return function (tree, file) {
    const filepath = file.history[0];
    if (!filepath) {
      return;
    }

    try {
      const repoRoot = execSync("git rev-parse --show-toplevel").toString().trim();
      const relativePath = path.relative(repoRoot, filepath);
      const result = execSync(
        `git -C "${repoRoot}" log -1 --pretty="format:%cI %H" -- "${relativePath}"`
      );
      const output = result.toString().trim();
      if (output) {
        const [date, commit] = output.split(" ");
        file.data.astro.frontmatter.lastModified = date;
        file.data.astro.frontmatter.lastModifiedCommit = commit;
      }
    } catch {
      // Ignore git errors so content still builds.
    }
  };
}