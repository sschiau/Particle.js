# v4 release checklist

v4.0.0 is a stable major version published under npm's `next` tag by explicit release policy. `latest` remains v3.0.3. The channel name does not change the version's SemVer status.

1. Review the core API, migration guide, benchmarks, demo, and local validation evidence. The existing workflows remain unchanged; the separate Node 24/26 matrix across three operating systems has not run.
2. Confirm the deployment can allocate machine IDs, retain a shared epoch, prevent unsafe machine reuse after restart, and handle clock/capacity errors.
3. Align package, lockfile, source, changelog, README, and demo versions. Keep raw historical benchmark labels unchanged.
4. Run `npm ci --ignore-scripts` and `npm run check` using supported Node versions; inspect the packed package and installed consumers.
5. Verify `publishConfig.tag` is `next` in the packed manifest. The unchanged publishing workflow runs npm publish without a tag flag, so npm applies this package-level setting. A CLI `--tag` overrides it; never pass `--tag latest` without separate approval.
6. Check registry state before release: `latest` must be `3.0.3`, and the new version must not exist. Push the matching `v4.0.0` tag only after validation; watch the existing trusted-publishing workflow to completion.
7. Verify registry metadata, provenance, README/diagram, installed CJS/ESM/type consumers, and Pages deployment. Confirm `next` is `4.0.0` and `latest` is still `3.0.3`.
8. Collect migration feedback. Promoting v4 to `latest` requires a separate decision. Keep the launch article as a draft until explicitly approved for posting.

Do not advertise the scoped distinct-output benchmark as an end-to-end speedup or a universal uniqueness guarantee. Do not replace old stored IDs with the new format without an explicit namespace and migration plan.
