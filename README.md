# Secure Git Bridge — Claude Desktop Extension

This repository contains the public review source for the Secure Git Bridge
Claude Desktop Extension.

Secure Git Bridge gives Claude human-controlled access to one locally selected
Git repository.

Claude can use bounded Secure Git Bridge tools for:

- repository information
- repository status
- Git history
- Git diff
- permitted file listing and reading
- patch proposals

Secure Git Bridge does not expose these capabilities to Claude:

- shell execution
- direct repository writes
- Apply
- proposal approval or rejection
- repository selection
- repository switching
- protected Git-internal or secret paths

## Authorization

Installing this extension does not grant repository access.

Repository authority requires:

1. The human selects a repository locally in Secure Git Bridge.
2. Secure Git Bridge generates a fresh one-time connection code.
3. The intended Claude session redeems that code.
4. Secure Git Bridge displays the matching request locally.
5. The human confirms the connection.

Only then is that Claude session authorized for the selected repository.

## Build 39

Secure Git Bridge version: `0.1.1`

Build: `39`

Claude Desktop Extension version: `0.1.39`

Production source commit:

`263330488a23f6be84d67b0739cf9e8335ef62d9`

## Commercial application

This repository contains only the Claude Desktop integration layer required for
review and interoperability.

The proprietary Secure Git Bridge macOS application, repository broker,
licensing system, release infrastructure, and commercial source code are not
published here.

## Official links

Website: https://securegitbridge.com/

Documentation: https://securegitbridge.com/docs/

Privacy: https://securegitbridge.com/privacy.html

Support: https://securegitbridge.com/account/support.php
