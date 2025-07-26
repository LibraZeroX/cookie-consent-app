# Contributing to **cookie-consent-app**

✨ _ありがとうございます！ / Thank you for helping us build the de-facto cookie-consent library for
Japan._

---

## Table of contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting started](#getting-started)
3. [Branch strategy](#branch-strategy)
4. [Commit message guidelines](#commit-message-guidelines)
5. [Pull-request workflow](#pull-request-workflow)
6. [Issue guidelines](#issue-guidelines)
7. [Coding style & tooling](#coding-style--tooling)
8. [Project structure](#project-structure)
9. [Release process](#release-process)
10. [Community & support](#community--support)

---

## Code of Conduct

We follow the [Contributor Covenant 2.1](./CODE_OF_CONDUCT.md).  
By participating you agree to abide by its terms.

---

## Getting started

```bash
# 1. Fork & clone
git clone https://github.com/<your-name>/cookie-consent-app.git
cd cookie-consent-app

# 2. Install dependencies (Node.js ≥ 20, npm ≥ 10)
npm ci

# 3. Run all packages in dev-mode
npm run dev      # Turbo will run each workspace dev script

# 4. Unit tests
npm test         # Vitest / Jest (package specific)

# 5. Lint, format, type-check
npm run lint
npm run type-check
```

> **Tip 🇯🇵**: コミット前に `npm run lint:fix`,`npm run format`
> を実行すると CI が通りやすくなります。

---

## Branch strategy

| Type        | Naming example               | Base branch   | Description                          |
| ----------- | ---------------------------- | ------------- | ------------------------------------ |
| **feature** | `feat/banner-dark-mode`      | `main`/`next` | New non-breaking functionality       |
| **bug-fix** | `fix/api-timeout`            | `main`        | Bug fixes                            |
| **docs**    | `docs/readme-ja`             | `main`        | Docs only                            |
| **hotfix**  | `hotfix/critical-cookie-bug` | `main`        | Urgent production fix                |
| **next**    | _(permanent)_                | –             | Where upcoming breaking changes land |

_Never push directly to `main`. Always open a PR._

---

## Commit message guidelines

We use **[Conventional Commits 1.0](https://www.conventionalcommits.org/)**.

```text
<type>(optional scope): <summary>   # ≤50 chars, English imperative
<BLANK LINE>
<body>                              # optional, can be Japanese
<BLANK LINE>
<footer>                            # Issue refs, BREAKING CHANGE
```

| type         | Purpose                            | Example                            |
| ------------ | ---------------------------------- | ---------------------------------- |
| **feat**     | New feature                        | `feat(api): add /collect endpoint` |
| **fix**      | Bug fix                            | `fix(core): handle null policy`    |
| **docs**     | Docs only                          | `docs(readme): add quick start`    |
| **refactor** | Code refactor (no behavior change) | `refactor(core): extract parser`   |
| **chore**    | Build/infra tasks                  | `chore(ci): add size-limit action` |

_先頭行は英語必須。本文は日本語 OK。_ Breaking changes ⇒ add `!` or `BREAKING CHANGE:` footer.

---

## Pull-request workflow

1. **Draft PR early** – allows CI to run & reviewers to follow progress.
2. Ensure:
   - ✔ Lint / type-check / test / build all pass (GitHub Actions)
   - ✔ 1 approval (Code Owners if scope matches)
   - ✔ PR title follows Conventional Commits

3. Update _linked Issue_ in the PR description: `Closes #123`, `Refs #456`.
4. **Squash & merge** – CI enforces linear history; one cohesive commit hits `main`.

Merged branches are auto-deleted.

---

## Issue guidelines

| Template            | Use when…                            |
| ------------------- | ------------------------------------ |
| **Bug Report**      | Something is broken. Provide repro!  |
| **Feature Request** | You have an idea or enhancement.     |
| **Question / Help** | Unsure about usage or legal matters. |

_Good-first-issue_ と _help-wanted_ には初心者歓迎タグが付いています。Please search existing issues
before opening a new one.

---

## Coding style & tooling

- **TypeScript 5** (strict)
- **ESLint** (`@typescript-eslint`, `prettier`), Prettier 3
- **Husky** + **lint-staged** → auto-format on commit
- **Vitest/Jest** for unit tests
- **Tsup** for package bundling
- **Turbo repo** for workspace orchestration

Run `npm run format:check` to verify formatting.

---

## Project structure

```
cookie-consent-app/
├─ packages/
│  ├─ core/         ← Consent logic & types
│  ├─ react/        ← React hook & provider
│  ├─ vue/          ← Vue 3 wrapper
│  └─ web-component/← Stencil/Lit custom element
├─ edge/            ← Cloudflare / Supabase adapters
├─ apps/
│  ├─ wizard/       ← Next.js config generator SPA
│  └─ dashboard/    ← Admin UI
└─ .github/         ← Workflows, issue/PR templates
```

---

## Release process

`semantic-release` runs on every commit to **main**:

| Commit type              | Version bump |
| ------------------------ | ------------ |
| `feat`                   | **minor**    |
| `fix`                    | **patch**    |
| `!` or `BREAKING CHANGE` | **major**    |

The job publishes to npm, updates **CHANGELOG.md**, and creates a GitHub Release.

---

## Community & support

- **Discussions** – ask questions, share ideas
- **Issues** – bug / feature tracking
- **Discord** – realtime chat (link in README)

Happy coding! 🎉
