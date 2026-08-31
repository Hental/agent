# Skill location

- When creating a new Skill and the user does not specify another location, create its source directory under `./skills/<skill-name>` in the current project.
- After creation, expose the Skill globally with a symbolic link from `${CODEX_HOME:-$HOME/.codex}/skills/<skill-name>` to the project source directory.
- Resolve both paths before linking. Do not replace an existing real directory or a symbolic link that points elsewhere; report the conflict and ask for direction.
- Keep the project directory as the source of truth. Edit and validate the project copy, not the global symbolic-link path.

# Intermediate artifacts

- Store screenshots, generated images, rendered previews, captured responses, debug logs, temporary reports, and similar intermediate artifacts under the project-root `./.reports/` directory.
- When an intermediate artifact is initially produced elsewhere, move it into `./.reports/` as soon as practical and reference the relocated path thereafter.
- Do not place intermediate artifacts inside source, Skill, or documentation directories. Keep final deliverables in the user-requested location.
- Use task-specific subdirectories under `./.reports/` when multiple artifacts are produced, and avoid overwriting unrelated existing artifacts.
