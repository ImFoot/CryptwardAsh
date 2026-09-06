# Repository workflow

- Make every file change on a dedicated feature or fix branch created from the current `origin/main`. Never make changes directly on `main` or reuse a branch from another task.
- Before editing, fetch and prune `origin`, fast-forward local `main`, and confirm that local `main` matches `origin/main`.
- Every pull request must include a version bump. Use semantic versioning and default to a patch increment for fixes or visual refinements. Keep the version synchronized in `package.json`, the root package entries in `package-lock.json`, and any version displayed in the UI.
- After implementing and testing a change, commit it, push the dedicated branch, and open a pull request. Do not describe the task as complete until the pull request exists and provide its link to the user.
- If work depends on another unmerged branch, create a stacked branch and target that dependency branch explicitly; otherwise target `main`.
