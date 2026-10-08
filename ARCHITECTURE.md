# Blake.pm Architecture

This document records the durable architectural decisions, repository boundaries, and current migration direction for `blake-pm`.

It should describe the current architecture and important planned transitions without becoming a detailed task tracker or development diary.

For setup and operational commands, see [README.md](README.md).

## Repository Responsibility

`blake-pm` owns the public website and the content it publishes.

Its responsibilities include:

- Astro website code;
- website content;
- website assets;
- Astro content definitions;
- content normalization and validation;
- rendering and presentation;
- static site generation;
- website-specific Cloudflare infrastructure.

Content editing is moving to the separate `blake-pm-cms` project.

## Content Architecture

The intended content flow is:

```text
blake-pm-cms
Keystatic editor + producer schema
        |
        v
GitHub: blake-pm
MDX + YAML frontmatter + assets
        |
        v
Astro content validation + normalization
        |
        v
Astro rendering
        |
        v
blake.pm
```

Keystatic primarily acts as a content producer.

The public website does not require Keystatic to interpret its stored content. Astro discovers the repository content, validates it, normalizes it where necessary, and renders it independently.

## Schema Responsibilities

The architecture intentionally contains two different content definitions serving different purposes.

### Keystatic Producer Schema

The authoritative native Keystatic schema is intended to live in `blake-pm-cms`.

It answers:

> What content can the editor produce?

It controls editor fields, collections, serialization, asset locations, and editing behavior.

### Astro Consumer Validation

`blake-pm` owns its Astro content definitions, normalization, and validation.

They answer:

> What content will the website accept and safely render?

This is not considered unnecessary duplication of the Keystatic schema. The CMS and website protect opposite sides of the content contract.

Compatibility tests should verify that representative Keystatic output satisfies the website's expectations.

## Embedded Keystatic Editor

### Current State

An older local Keystatic editor remains embedded in `blake-pm`.

It includes a duplicate native Keystatic schema and supporting editor-specific Astro, React, configuration, and launcher code.

### Decision

The embedded editor is scheduled for retirement.

`blake-pm-cms` will become the single authoritative Keystatic editor and native Keystatic producer schema.

Until removal is completed:

- do not add new functionality to the embedded editor;
- do not evolve its schema independently;
- keep it functional only as necessary during the transition.

After the content contract has appropriate compatibility coverage, remove the embedded editor and its editor-only dependencies/configuration in a dedicated change.

## CMS Boundary

`blake-pm` should not own long-term responsibility for:

- CMS hosting;
- Keystatic GitHub App authentication;
- CMS Docker deployment;
- CMS production runtime;
- CMS image publishing;
- CMS-specific Cloudflare Access or Tunnel configuration.

Those responsibilities belong to `blake-pm-cms` and its deployment environment.

## Deployment Environments

The public website currently has production and website staging configurations.

That is separate from the CMS deployment decision.

The CMS will have one permanent production deployment. A permanent staging CMS is not currently planned.

Temporary/local CMS environments may be used when validating changes or dependency upgrades.

Do not infer from the removal of CMS staging that the website staging environment should also be removed. That is a separate decision.

## Upstream Keystatic

The projects should remain close to normal upstream Keystatic.

Prefer:

- documented/public Keystatic APIs;
- ordinary native Keystatic schemas;
- standard GitHub storage;
- standard framework integrations.

Avoid without an explicit requirement:

- modifying Keystatic source;
- patching upstream packages;
- relying on undocumented internal APIs;
- custom authentication or storage implementations;
- dynamic remote TypeScript schema execution;
- a custom schema language;
- a visual schema designer.

The goal is to use Keystatic rather than maintain a private CMS fork.

## Multi-Site Direction

`blake-pm-cms` currently exists to edit `blake-pm`.

Another site may eventually use the same CMS codebase, but there is no current requirement to implement multi-site support.

Do not prematurely introduce:

- dynamic repository switching;
- dynamic remote schema loading;
- multi-tenant CMS infrastructure;
- generic site registries;
- custom schema translation.

If a second site becomes real, the preferred starting point is common CMS source with separately configured native Keystatic builds or instances.

This keeps each editor close to ordinary upstream Keystatic while allowing the CMS codebase to be reused.

## Visual Schema Editing

A visual content-model/schema designer is intentionally not part of the current roadmap.

Keystatic provides a visual content editor driven by code-defined schemas.

Building a generic visual schema designer would require ownership of additional schema representation, translation, validation, migration, typing, and compatibility behavior.

That would move this project toward maintaining a custom CMS framework.

Reconsider this only if repeated real-world schema changes create a demonstrated need.

## Dependency Upgrades

Keystatic and Astro upgrades should be deliberate.

At the time of the architecture investigation:

- `@keystatic/core` was already current;
- the newer `@keystatic/astro` major version required a newer Astro major version than the projects currently use.

Do not force unsupported dependency combinations merely to reach the latest package version.

Separating the embedded website editor from the standalone CMS will allow the CMS and public website to evolve their Astro/framework dependencies independently.

Future CMS dependency upgrades should validate:

- dependency compatibility;
- builds and type checking;
- representative content;
- GitHub authentication;
- GitHub editing;
- asset handling;
- container runtime;
- public/proxied access.

## Current Migration Plan

1. **Architecture investigation — complete.**
2. **Keystatic ↔ Astro content-contract fixes and compatibility tests — next/current work.**
3. Remove the embedded Keystatic editor and duplicate native schema from `blake-pm`.
4. Establish/finalize the `blake-pm-cms` Git repository and known baseline.
5. Reconcile CMS Docker configuration and documentation with the working Mac mini deployment.
6. Add the intended GHCR image build and publishing workflow.
7. Separately evaluate upgrading the CMS framework and `@keystatic/astro` after the architecture is decoupled.

These should normally be completed as separate, reviewable changes rather than one large refactor.

## Documentation Rules

Update this file whenever a change affects:

- repository ownership or responsibilities;
- the CMS/website boundary;
- the content contract;
- the authoritative Keystatic schema location;
- deployment architecture;
- major dependency strategy;
- multi-site strategy;
- another durable architectural decision;
- completion or modification of the migration plan.

When a migration item is completed:

1. mark it complete here;
2. update any affected current-state sections;
3. remove or revise transitional language that is no longer true;
4. update the README if normal usage changed;
5. update specialized operational documentation if production behavior changed.

Do not append a running history of every implementation change. Git already provides that history.

This document should describe reality first and planned transitions second.