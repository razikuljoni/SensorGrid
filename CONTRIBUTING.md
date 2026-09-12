# Contributing to SensorGrid

Thank you for contributing to **SensorGrid**! This document provides guidelines for local development, code style, commit conventions, and submitting pull requests.

---

## 🚀 Quick Start

1. **Fork & Clone repository**
2. **Install dependencies**:
   ```bash
   pnpm install
   ```
3. **Configure Database**:
   ```bash
   pnpm run db:push
   pnpm run db:seed
   ```
4. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

---

## 🎨 Code Style & Quality

Before submitting code, run local verification:

```bash
# Check ESLint rules
pnpm run lint

# Check TypeScript compiler
pnpm run typecheck

# Format code with Prettier
pnpm run format
```

---

## 📝 Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) and Git Emojis:

| Type       | Emoji           | Description                                |
| ---------- | --------------- | ------------------------------------------ |
| `feat`     | ✨ `:sparkles:` | New feature                                |
| `fix`      | 🐛 `:bug:`      | Bug fix                                    |
| `docs`     | 📝 `:memo:`     | Documentation updates                      |
| `style`    | 💄 `:lipstick:` | Styling or formatting                      |
| `refactor` | ♻️ `:recycle:`  | Code refactoring without behavioral change |
| `perf`     | ⚡ `:zap:`      | Performance improvement                    |
| `test`     | 🧪 `:vial:`     | Adding or updating tests                   |
| `chore`    | 🔧 `:wrench:`   | Infrastructure, build, tools setup         |

**Example Commit Message:**

```
:sparkles: feat: add realtime telemetry filter to dashboard
```

---

## 🔀 Pull Request Process

1. Create a feature branch: `git checkout -b feat/telemetry-filter`
2. Make commits following conventional commit rules
3. Verify `pnpm run lint` and `pnpm run typecheck` pass cleanly
4. Push branch and open Pull Request targeting `dev` branch
5. Ensure CI checks pass on GitHub Actions
