# RFC-0003: Visual identity — App icon, splash screen e tema Light Clean

---
rfc_id: RFC-0003
title: Visual identity — App icon, splash screen e tema Light Clean
status: PROPOSED
author: Renato de Campos
reviewers: []
created: 2026-04-25
last_updated: 2026-04-25
decision_date: —
---

## Overview

Este RFC especifica a identidade visual do app Passkey Demo: ícone de aplicativo, splash screen e
alinhamento dos tokens de cor ao tema **Light Clean**. O objetivo é substituir os placeholders
padrão do Expo por ativos com identidade própria, garantindo consistência visual entre a primeira
impressão do app (launcher, splash) e a UI já implementada em RFC-0002.

## Background & Context

### Estado atual

RFC-0001 e RFC-0002 estão completos. O sistema funciona end-to-end. A UI do app usa a paleta
correta (`#F8FAFC` bg, `#2563EB` primary, etc.), mas os ativos visuais de identidade são todos
defaults do Expo SDK:

```
passkeys-app/assets/images/
├── icon.png          ← placeholder Expo (círculos concêntricos, fundo cinza)
├── adaptive-icon.png ← placeholder Expo (mesmo conteúdo)
├── splash-icon.png   ← placeholder Expo (mesmo conteúdo)
└── favicon.png       ← placeholder Expo (16×16 genérico)
```

O arquivo `app.json` referencia esses ativos sem cor de fundo customizada, resultando em splash
branca com ícone genérico ao inicializar o app.

### Documentos relacionados

- `rfcs/completed/RFC-0001-passkeys-poc-completion.md`
- `rfcs/completed/RFC-0002-ux-passkeys-poc.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`

### Glossário

| Termo | Definição |
|-------|-----------|
| Light Clean | Variante de tema com fundo `#F8FAFC`, primary `#2563EB`, texto `#0F172A` |
| Lock Icon | Símbolo de cadeado geométrico usado como identidade visual principal |
| Adaptive Icon | Formato Android com foreground + background separados (API 26+) |
| Splash backgroundColor | Cor sólida exibida enquanto o bundle JS carrega, antes do `SplashScreen` do Expo |

---

## Problem statement

O app não tem identidade visual própria. Na inicialização, o usuário vê o ícone padrão do Expo
no launcher e uma splash branca sem marca. Isso prejudica demos, porque a primeira impressão não
comunica "app de autenticação segura" — e qualquer screenshot ou vídeo de demonstração expõe os
placeholders. O RFC-0002 melhorou a UI interna; este RFC cobre a camada externa.

**Se não endereçarmos:** qualquer demo, vídeo ou screenshot do app continuará com aparência de
scaffold, reduzindo a credibilidade do PoC como referência de implementação.

---

## Goals & Non-Goals

### Goals

- Substituir `icon.png`, `adaptive-icon.png`, `splash-icon.png` e `favicon.png` por ativos com
  identidade do projeto
- Configurar `app.json` com `backgroundColor` e `splash.backgroundColor` alinhados ao Light Clean
- Manter compatibilidade com Expo SDK 53 e o formato de ícone Android (adaptive icon)
- Não adicionar nova dependência nativa
- Não alterar nenhum arquivo de código TypeScript/React Native

### Non-Goals

- Suporte a ícone iOS (fora do escopo do PoC Android)
- Animação nativa de splash via `expo-splash-screen` além do que já existe
- Branding de produto ou nome comercial
- Criação de um design system reutilizável

---

## Evaluation criteria

| Critério | Peso | Descrição |
|----------|------|-----------|
| Consistência visual | Alto | Ícone e splash devem usar os mesmos tokens de cor da UI |
| Clareza de identidade | Alto | Ícone legível em 48 px; comunica autenticação/segurança |
| Compatibilidade Expo | Alto | Dimensões e formato corretos para `expo-build-service` |
| Tempo de implementação | Médio | Substituição de arquivo, sem compilação nativa extra |
| Qualidade de demo | Médio | Screenshots e vídeos não expõem placeholders |

---

## Options analysis

### Option 1: Cadeado geométrico (Lock Icon)

**Descrição:** Ícone de cadeado minimalista com shackle arredondada e corpo retangular.
Fundo `#F8FAFC` (Light Clean), cadeado em `#2563EB` (primary). Splash com mesmo ícone
centralizado + "Passkey Demo" abaixo, separados por linha divisória sutil.

**Pros:**
- Metáfora direta: cadeado = autenticação segura
- Leitura clara em 32 px (launcher, notificações)
- Tokens idênticos aos já usados em `app/index.tsx` (T.primary, T.bg)
- Sem SVG complexo — formas geométricas simples

**Cons:**
- Cadeado é ícone comum em apps de segurança (menor unicidade)

**Scoring:**
| Critério | Score | Notas |
|----------|-------|-------|
| Consistência visual | Alto | Tokens idênticos à UI |
| Clareza de identidade | Alto | Leitura imediata em qualquer tamanho |
| Compatibilidade Expo | Alto | PNG gerado em canvas sem SVG externo |
| Tempo de implementação | Alto | Apenas substituição de arquivos |
| Qualidade de demo | Alto | Elimina placeholders |

**Esforço:** Baixo — geração de PNGs + edição de `app.json`.  
**Risco:** Baixo. Nenhuma mudança em código nativo.

---

### Option 2: Impressão digital (Fingerprint)

**Descrição:** Anéis concêntricos com abertura inferior (padrão whorl), representando
biometria. Fundo escuro (`#080D1A`), anéis em ciano (`#38BDF8`). Visual mais técnico/dark.

**Pros:**
- Referência direta à biometria do WebAuthn
- Visual distintivo e moderno

**Cons:**
- Contraste invertido: ícone escuro não combina com a UI Light Clean do app
- Pode parecer "genérico" (anéis concêntricos são o próprio placeholder Expo)

**Scoring:**
| Critério | Score | Notas |
|----------|-------|-------|
| Consistência visual | Médio | Contraste oposto à UI interna |
| Clareza de identidade | Alto | Biometria é reconhecida |
| Compatibilidade Expo | Alto | — |
| Tempo de implementação | Alto | — |
| Qualidade de demo | Médio | Desalinhamento visual com o app |

**Esforço:** Baixo.  
**Risco:** Baixo, mas inconsistência com o tema Light Clean.

---

## Recommendation

**Option 1: Cadeado geométrico (Lock Icon)**

Alinha com a UI já validada no RFC-0002, usa os mesmos tokens, e comunica autenticação segura
sem depender de metáfora biométrica que conflita visualmente com o tema claro do app.

---

## Technical design

### Tokens de cor

Idênticos ao mapa de tokens já em uso em `app/index.tsx` e `app/home.tsx`:

| Token | Valor | Uso |
|-------|-------|-----|
| `bg` | `#F8FAFC` | Fundo do ícone, splash background |
| `surface` | `#FFFFFF` | Fundo de cards |
| `primary` | `#2563EB` | Cadeado, contornos, accent |
| `text` | `#0F172A` | Título na splash |
| `textSecondary` | `#475569` | Tagline na splash |
| `border` | `#E2E8F0` | Linha divisória na splash |

### Especificação do ícone

```
Forma: cadeado geométrico
  Shackle:  largura 28 px, altura 30 px, raio 14 px (medidas em canvas 200×200)
  Corpo:    56×42 px, border-radius 10 px
  Buraco:   círculo r=7 px + haste vertical
  Cor:      #2563EB (stroke + fill alpha 0.07)
  Fundo:    #F8FAFC (fill)

Arquivos a gerar (PNG, canal alpha para adaptive-icon foreground):
  icon.png           1024×1024 px   corners radius 22% (iOS-safe)
  adaptive-icon.png  1024×1024 px   sem corners (Android recorta via máscara)
  splash-icon.png     200×200 px    sem corners
  favicon.png          32×32 px    sem corners
```

### Especificação da splash screen

```
Dimensões: viewport do dispositivo (Expo gerencia)
Fundo:     #F8FAFC  (splash.backgroundColor em app.json)
Conteúdo:
  [cadeado]        splash-icon.png centralizado
  [divisória]      linha horizontal 1 px, cor #E2E8F0, largura 48 px
  [título]         "Passkey Demo" — DM Sans 700, 20 px, #0F172A
  [tagline]        "PASSWORDLESS · SECURE" — DM Mono 400, 11 px, #2563EB, letter-spacing 0.12em

Layout: flex column, align center, justify center; título nunca sobrepõe o ícone
```

### Mudanças em `app.json`

```jsonc
{
  "expo": {
    "name": "Passkey Demo",
    "icon": "./assets/images/icon.png",
    "backgroundColor": "#F8FAFC",          // ← adicionar
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "backgroundColor": "#F8FAFC",        // ← atualizar (era "#ffffff" implícito)
      "resizeMode": "contain"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#F8FAFC"       // ← atualizar (era "#FFFFFF")
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

> **Nota:** o campo `splash.image` aponta para `splash-icon.png` (200×200), não para `icon.png`.
> O Expo posiciona e escala `splash-icon.png` sobre o `backgroundColor` conforme `resizeMode`.

### Geração dos PNGs

Os ativos são gerados via canvas HTML (sem dependência de ferramenta de design externa).
O arquivo de referência é `Passkey Icon Design.html` na raiz do projeto de design.

Procedimento:
1. Abrir `Passkey Icon Design.html` no browser
2. Selecionar variante **Light Clean**
3. Clicar em cada botão de export:
   - `↓ icon.png (1024×1024)` → salvar em `passkeys-app/assets/images/icon.png`
   - `↓ adaptive-icon.png`    → salvar em `passkeys-app/assets/images/adaptive-icon.png`
   - `↓ splash-icon.png`      → salvar em `passkeys-app/assets/images/splash-icon.png`
   - `↓ favicon.png (32×32)`  → salvar em `passkeys-app/assets/images/favicon.png`

### Verificação

Após substituição dos arquivos:

```bash
cd passkeys-app
npx expo run:android
# Verificar:
# 1. Ícone no launcher mostra cadeado azul sobre fundo claro
# 2. Splash mostra fundo #F8FAFC (sem flash branco/preto)
# 3. Layout interno do app inalterado (sem regressão de UI)
```

---

## Implementation plan

### Phase 1 — Geração e substituição dos ativos

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 1.1 | `passkeys-app/assets/images/icon.png` | Substituir por export Light Clean 1024×1024 |
| 1.2 | `passkeys-app/assets/images/adaptive-icon.png` | Substituir por export Light Clean 1024×1024 |
| 1.3 | `passkeys-app/assets/images/splash-icon.png` | Substituir por export Light Clean 200×200 |
| 1.4 | `passkeys-app/assets/images/favicon.png` | Substituir por export Light Clean 32×32 |

**Arquivo de tarefa:** `tasks/rfc-0003/fase-1-ativos.md`  
**Critério de conclusão:** os quatro arquivos PNG substituídos, sem arquivos extras criados.

### Phase 2 — Configuração do `app.json`

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 2.1 | `passkeys-app/app.json` | Adicionar `backgroundColor: "#F8FAFC"` no root |
| 2.2 | `passkeys-app/app.json` | Atualizar `splash.backgroundColor` para `"#F8FAFC"` |
| 2.3 | `passkeys-app/app.json` | Atualizar `android.adaptiveIcon.backgroundColor` para `"#F8FAFC"` |

**Arquivo de tarefa:** `tasks/rfc-0003/fase-2-appjson.md`  
**Critério de conclusão:** `app.json` válido (JSON parse sem erro) com os três campos atualizados.

### Phase 3 — Validação no emulador

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 3.1 | — | `npx expo run:android` no emulador API 34+ |
| 3.2 | — | Confirmar ícone no launcher |
| 3.3 | — | Confirmar splash com fundo correto e sem flash |
| 3.4 | — | Confirmar que o fluxo register → home → logout funciona (sem regressão) |
| 3.5 | `tasks/rfc-0003/fase-3-validacao.md` | Registrar evidência (checklist de itens acima) |

**Arquivo de tarefa:** `tasks/rfc-0003/fase-3-validacao.md`  
**Critério de conclusão:** os quatro itens de validação marcados `[x]` no arquivo de tarefa.

### Phase 4 — Documentação

Escopo fixo:
- Mover este RFC para `rfcs/completed/RFC-0003-visual-identity.md`
- Preencher `## Decision Record` abaixo
- Atualizar `passkeys-app/README.md` se a seção de setup mencionar ícone ou splash

**Critério de conclusão:** RFC em `completed/` com Decision Record preenchido.

### Rollback

Rollback é substituição de arquivo:
- Restaurar os quatro PNGs originais do Expo (disponíveis em qualquer scaffold `npx create-expo-app`)
- Reverter `app.json` para os valores originais (sem `backgroundColor` explícito)

Sem mudança em código TypeScript, sem impacto em testes ou lint.

---

## Open questions

1. **`splash.image` vs `splash-icon.png`:** confirmar se o Expo SDK 53 renderiza melhor com
   o ícone em 200×200 (`contain`) ou em resolução maior com `resizeMode: "cover"`.
2. **Dark mode:** o Android pode exibir o adaptive icon sobre fundo escuro em certas launchers.
   Confirmar se `backgroundColor: "#F8FAFC"` é suficiente ou se é necessário um `monochrome`
   icon layer (API 33+).
3. **EAS Build:** confirmar que os PNGs exportados via canvas (sem canal alpha no fundo) são
   aceitos pelo pipeline `eas build` sem pré-processamento adicional.

---

## Decision record

_(a preencher após aprovação e implementação)_

- **Date:** —
- **Decision:** —
- **Verified deliverables:** —
- **Open questions resolved:** —
- **Out of scope (confirmed):** —
