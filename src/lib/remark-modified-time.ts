import { execSync } from "child_process";
import path from "path";
import type { VFile } from "vfile";

export function remarkModifiedTime() {
  return function (tree: unknown, file: VFile) {
    const candidates = [file.path, ...(file.history ?? [])].filter(
      (value): value is string => typeof value === "string"
    );
    const rawPath = candidates.find((value) => {
      const cleaned = value.split("?")[0].split("#")[0];
      const ext = path.extname(cleaned).toLowerCase();
      return ext === ".md" || ext === ".mdx";
    });
    if (!rawPath) {
      return;
    }

    try {
      const cleanedPath = rawPath.split("?")[0].split("#")[0];
      const ext = path.extname(cleanedPath).toLowerCase();
      if (ext !== ".md" && ext !== ".mdx") return;

      const cwd = typeof file.cwd === "string" ? file.cwd : process.cwd();
      const absolutePath = path.isAbsolute(cleanedPath)
        ? cleanedPath
        : path.join(cwd, cleanedPath);
      const fileDir = path.dirname(absolutePath);
      const repoRoot = execSync(`git -C "${fileDir}" rev-parse --show-toplevel`)
        .toString()
        .trim();
      const relativePath = path.relative(repoRoot, absolutePath);
      if (relativePath.startsWith("..")) {
        return;
      }

      const result = execSync(
        `git -C "${repoRoot}" log -1 --pretty="format:%cI %H" -- "${relativePath}"`
      );
      const output = result.toString().trim();
      if (output) {
        const [date, commit] = output.split(" ");
        const data = file.data as {
          astro?: { frontmatter?: Record<string, unknown> };
        };
        if (!data.astro) {
          data.astro = {};
        }
        if (!data.astro.frontmatter) {
          data.astro.frontmatter = {};
        }
        data.astro.frontmatter.lastModified = date;
        data.astro.frontmatter.lastModifiedCommit = commit;
      }
    } catch {
      // Ignore git errors so content still builds.
    }
  };
}