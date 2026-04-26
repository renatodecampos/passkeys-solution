---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary']
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-04-25-1200.md'
  - '_bmad-output/project-context.md'
  - 'docs/project-overview.md'
  - 'docs/architecture-server.md'
  - 'docs/architecture-app.md'
  - 'docs/integration-architecture.md'
  - 'docs/api-contracts-server.md'
  - 'docs/data-models-server.md'
  - 'docs/component-inventory-app.md'
  - 'docs/development-guide.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/workflow-idea-to-implementation.md'
  - 'docs/harness-presentation.md'
  - 'docs/index.md'
workflowType: 'prd'
classification:
  projectType: 'mobile_app+api_backend'
  domain: 'security_identity'
  complexity: 'high'
  projectContext: 'brownfield'
  prdPurpose: 'product_proposal'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 13
---

# Product Requirements Document - passkeys-solution

**Author:** Renato
**Date:** 2026-04-26

## Executive Summary

This document proposes productizing a proof-of-concept passkeys authentication system — a passwordless, phishing-resistant authentication solution with a novel account-takeover (ATO) detection layer built on Android Keystore hardware binding.

The PoC (completed April 2026 across four RFCs) demonstrates end-to-end passkey registration and authentication using FIDO2/WebAuthn on Android, with a Fastify/TypeScript backend and Expo/React Native client. The core innovation — RFC-0004 — extends standard passkeys with an app-managed Keystore key invalidated on new biometric enrollment. When a thief steals a device and enrolls their own fingerprint to use the victim's passkey, the binding key is invalidated; the server receives a `binding=lost` signal and can block or flag the authentication attempt. This provides an ATO resistance layer that no standard WebAuthn implementation offers.

**Target users:** Product and engineering teams building mobile applications that require strong, phishing-resistant authentication with elevated protection against stolen-device account takeover — particularly relevant for fintech, banking, and high-stakes consumer apps.

### What Makes This Special

Standard passkeys solve phishing and password-reuse but do not address the stolen-device threat model: a registered passkey on a stolen phone remains usable if the attacker can authenticate with any enrolled biometric. This system closes that gap.

The differentiator is the **biometric integrity signal**: an Android Keystore key bound to the device's biometric enrollment state at passkey registration time. Any change to enrolled biometrics (adding a fingerprint, re-enrolling) invalidates the binding key — a hardware-enforced signal that the device's trust state has changed. Combined with a per-attempt audit trail (`auth_attempts` collection) and server-side policy enforcement (`AUTH_DENY_ON_BINDING_LOST`), this gives product teams a configurable, evidence-based ATO mitigation mechanism.

The approach is additive: the binding signal enriches the existing WebAuthn flow without breaking FIDO2 compliance or requiring changes to the passkey credential lifecycle.

## Project Classification

| Attribute | Value |
|---|---|
| **Project Type** | Mobile app (Expo/React Native) + API backend (Fastify/Node.js) |
| **Domain** | Security / Identity — passkeys, WebAuthn/FIDO2, Android Keystore |
| **Complexity** | High — hardware-bound cryptography, cross-platform auth, security-critical policy enforcement |
| **Project Context** | Brownfield — completed PoC (4 RFCs), proposing productization |
| **Platform scope** | Android-first (PoC proven); iOS future phase |
