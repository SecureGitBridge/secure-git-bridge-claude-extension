# Security

Secure Git Bridge uses a local human-controlled authorization boundary.

Installation of the Claude Desktop Extension alone grants no repository access.

A Claude session receives repository authority only after:

1. A fresh one-time connection code is generated locally.
2. The intended Claude session redeems it.
3. The matching request is explicitly confirmed by the human in Secure Git Bridge.

## Claude-facing capabilities

Secure Git Bridge permits bounded repository inspection and patch proposals.

It does not expose to Claude:

- shell execution
- direct repository writes
- Apply
- proposal approval
- proposal rejection
- repository selection
- repository switching
- protected Git-internal paths

Security reports:

https://securegitbridge.com/account/support.php
