# Feedback Forward — cross-RFC summary

> Central log for token tracking, cross-cutting insights, and context window analysis.
> Per-RFC phase retrospectives live in each RFC folder:
> - RFC-0001: `tasks/rfc-0001/feedback-forward.md`
> - RFC-0002: `tasks/rfc-0002/feedback-forward.md`
> - RFC-0003: `tasks/rfc-0003/feedback-forward.md`

---

## Token summary

> Updated by the agent at the end of each phase.
> **Recommended limit: ≤ 75% context window.** Above that, risk of silent errors increases
> (instructions dropped, wrong file edited). Plan a new context window before reaching 75%.

| RFC | Phase | Tool | Tokens | Context % |
|-----|-------|------|--------|-----------|
| RFC-0001 | 1 | — | — | — |
| RFC-0001 | 1b | — | — | — |
| RFC-0001 | 2 | — | — | — |
| RFC-0001 | 3 | — | — | — |
| RFC-0001 | 4 | — | — | — |
| RFC-0002 | 1 | Cursor | ~78.6k | 39.3% |
| RFC-0002 | 2 | Cursor | ~109k | 54.3% |
| RFC-0002 | 3 | Cursor | ~75.3k | 37.7% |
| RFC-0003 | 1 | Cursor | ~60k | ~30% |
| RFC-0003 | 2 | Cursor | ~51.5k | ~25.8% |
| RFC-0003 | 3 | Cursor | ~172k | 86% ⚠️ |
| RFC-0003 | 4 | Cursor | ~73.9k | 37% |
| (session) | 2026-04-25 — app troubleshooting / Expo / .env / Android TLS | Cursor | ~172k | 86% ⚠️ |
| RFC-0004 | 1 | Cursor | ~113k | 56% |
| RFC-0004 | 2+3 | Claude Code (Sonnet 4.6) | — | — |

**Total tokens tracked:** ~1014k — RFC-0002: phase 1 (~78.6k) + phase 2 (~109k) + phase 3 (~75.3k); RFC-0003: phase 1 (~60k) + phase 2 (~51.5k) + phase 3 (~172k, **86%** ⚠️) + phase 4 (~73.9k); RFC-0004 phase 1 (~113k, 56%); session 2026-04-25 (~172k, **86%** ⚠️); RFC-0001 all phases still "—" where not reported. (Approximate; sums rounded.)

---

## Cross-cutting insights (all RFCs)

| Category | Insight | Priority |
|----------|---------|----------|
| **Spec** | Always cross-check env var names with `setup/index.ts` before writing the phase | High |
| **Spec** | Verify paths for tooling outputs (keystores, certs) by running them before fixing in the spec | High |
| **Tests** | HTTP service tests should assert request body/headers, not only mocked responses | Medium |
| **Infra** | Subtasks needing hardware or manual interaction → tag **[manual action]** + do not block the parallelism map | Medium |
| **Tooling** | Pin CLI flag versions in the spec (e.g. `--testPathPatterns` in Jest v29) | Low |
| **Architecture** | Define app route structure (which file is authenticated home) in the RFC, not only in a phase | High |
| **Blockers** | Phase with 3+ resolved blockers = prior phase spec had gaps; review template to require stricter preconditions | High |
| **Harness scaffold** | `/feature-dev create harness` should create all `fase-*.md` files upfront — missing phase files cause overhead during execution | High |

---

## Context window analysis

> **Limit: ≤ 75%.** When a phase exceeds this threshold, the agent must fill the post-mortem
> below so the harness can be improved to prevent recurrence.

### Thresholds

| Usage | Signal | Action |
|-------|--------|--------|
| ≤ 60% | Healthy | No action |
| 61–75% | Acceptable | Note what drove usage; watch for patterns |
| 76–85% | Over limit | Fill post-mortem below; split phase or reduce reads in spec |
| > 85% | Critical | Phase should have been split earlier; mandatory post-mortem |

### Post-mortems (phases that exceeded 75%)

| RFC | Phase | Context % | Root cause summary |
|-----|-------|-----------|-------------------|
| RFC-0003 | 3 | 86% ⚠️ | Native validation (prebuild, aapt, device install) + asset blocker (deleted SpaceMono/react-logo) required multiple tool rounds and large log output |

**Root cause questions:**

1. **What drove context growth?** Combination of: (a) stale `android/` native tree requiring `expo prebuild` + log output; (b) broken Metro bundle due to deleted template assets (`SpaceMono`, `react-logo*.png`) requiring diagnosis and fix; (c) `fase-3-validacao.md` missing on disk — created during execution.
2. **Was it avoidable?** Partially. The native stale-tree issue was avoidable if phase 2 had required `expo prebuild` as a completion step. The deleted assets were working-tree state the spec could not anticipate. Phase file creation overhead is avoidable if the harness scaffolds all files upfront.
3. **What should change in the spec or template?** (a) Phase 2 completion criterion must include `expo prebuild --platform android` + `colors.xml` assertion — already applied. (b) RFC harness creation should scaffold all `fase-*.md` files upfront. (c) Device validation phases should warn the agent that native log output is verbose — summarize, don't paste in full.
4. **Applied where?** `tasks/rfc-0003/fase-2-appjson.md` completion criterion (prebuild step added). `AGENTS.md` §0 command table (RFC-0003 rows). Harness scaffold note added to Cross-cutting insights above.

### Patterns to watch

| Pattern | Phases affected | Mitigation applied |
|---------|-----------------|--------------------|
| Missing `fase-*.md` on disk at phase start | RFC-0003 phases 1, 2, 3, 4 | Scaffold all phase files when creating RFC harness |
| Stale `android/` after `app.json` changes | RFC-0003 phase 3 | Phase 2 completion criterion now requires `expo prebuild` |
