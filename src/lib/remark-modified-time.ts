import { execSync } from "child_process";
import path from "path";
import type { VFile } from "vfile";

export function remarkModifiedTime() {
  return function (tree: unknown, file: VFile) {
    const rawPath = file.path ?? file.history?.[0];
    if (!rawPath) return;

    const cleanedPath = rawPath.split("?")[0].split("#")[0];
    const ext = path.extname(cleanedPath).toLowerCase();
    if (ext !== ".md" && ext !== ".mdx") return;

    const cwd = typeof file.cwd === "string" ? file.cwd : process.cwd();
    const absolutePath = path.isAbsolute(cleanedPath)
      ? cleanedPath
      : path.join(cwd, cleanedPath);
    const articleDir = path.dirname(absolutePath);

    try {
      const output = execSync(
        `git -C "${articleDir}" log -1 --pretty="format:%cI %H" -- .`
      )
        .toString()
        .trim();
      if (!output) return;

      const data = file.data as {
        astro?: { frontmatter?: Record<string, unknown> };
      };
      data.astro ??= {};
      data.astro.frontmatter ??= {};
      const [date, commit] = output.split(" ");
      data.astro.frontmatter.lastModified = date;
      data.astro.frontmatter.lastModifiedCommit = commit;
    } catch {
      // Ignore git errors so content still builds.
    }
  };
}