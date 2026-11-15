# v4 candidate release checklist

The branch is a release candidate, not a replacement for npm's stable v3.0.3. A new major version is necessary because the API and ID format change.

1. Review the core API, migration guide, benchmarks, demo, and local validation evidence. The existing workflows remain unchanged; the separately proposed Node 24/26 matrix across three operating systems has not run.
2. Confirm each deployment can allocate machine IDs, retain a shared epoch, prevent unsafe machine reuse after restart, and handle clock/capacity errors.
3. For release documentation, change candidate status text and the stable-demo label to match the actual availability; keep npm-version badges sourced from npm.
4. Run `npm ci --ignore-scripts` and `npm run check`; inspect `npm pack --dry-run`.
5. Verify package, lockfile, source, changelog, and examples all name the intended version.
6. **Do not push the candidate tag or dispatch the existing publishing workflow.** It publishes with the default npm tag (**latest**), including prereleases. First approve and validate a separate publishing plan that explicitly uses **next** for candidates. Only then publish the matching `v4.0.0-rc.1` version and verify that **latest** remains unchanged.
7. Verify the npm version, provenance, README, actual installed CJS/ESM/type consumers, and the Pages deployment.
8. Collect migration feedback before preparing stable 4.0.0. Publish the launch article only after its availability and version claims are accurate.

Do not advertise the scoped distinct-output benchmark as an end-to-end speedup or a universal uniqueness guarantee. Do not replace old stored IDs with the new format without an explicit namespace and migration plan.
