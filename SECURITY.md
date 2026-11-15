# Security policy

Report suspected vulnerabilities privately to the maintainer at **pr@silviu.co**, or use GitHub's private vulnerability reporting if available. Include the version, a minimal reproduction using synthetic data, impact, and suggested mitigation. Never include production credentials or private records.

Version 3 has documented integer-precision and random-sequence collision limitations. It must not be presented as a guaranteed-unique ID generator. The v4 candidate replaces those mechanisms, but its uniqueness conditions remain part of the API contract; see [the API reference](docs/api.md).

IDs are predictable identifiers, not secrets, access tokens, or substitutes for authorization. Validate access to every resource independently. Decode externally supplied v4 IDs using the bounded bigint/decimal-string parser; do not coerce them to Number.

The browser demo uses local ES modules and styles, no runtime network requests, text-only DOM rendering, and a restrictive CSP. Site operators should configure any additional response headers appropriate to their deployment; the HTML meta policy does not provide frame-ancestor protection.

The local `npm run check` command runs correctness, declaration, package-consumer, and security regression tests plus npm audit. The existing publishing workflow runs runtime/security tests and npm audit; broader CI coverage is proposed separately. A passing test suite or security score is evidence of those checks, not a guarantee against all defects. There is no promised response SLA for this volunteer project.
