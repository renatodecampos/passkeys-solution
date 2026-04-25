---
rfc_id: RFC-0002
title: UX da POC de Passkeys Android
status: COMPLETED
author: Renato de Campos
reviewers: []
created: 2026-04-25
last_updated: 2026-04-25
decision_date: 2026-04-25
---

# RFC-0002: UX da POC de Passkeys Android

## Overview

Esta RFC especifica a evolução de UX da POC Android de passkeys após a conclusão da RFC-0001.
O objetivo é transformar o fluxo funcional já validado em uma experiência de demonstração mais
clara, confiável e diagnóstica: criar passkey, autenticar com passkey, visualizar prova de
verificação do servidor e recuperar-se de falhas comuns de setup local.

A fonte de produto/UX é `_bmad-output/planning-artifacts/ux-design-specification.md`, concluída
em 2026-04-25. Esta RFC converte essa especificação em harness de engenharia implementável.

## Background & Context

### Estado atual

RFC-0001 está concluída. O sistema já executa o fluxo end-to-end em Android:

```
passkeys-server
└── HTTPS local em https://localhost:3000 com mkcert

passkeys-app
├── app/index.tsx      # tela simples de username, registrar e entrar
├── app/home.tsx       # tela autenticada simples
└── services/api.ts    # chamadas HTTP ao server
```

O fluxo técnico funciona, mas a UI ainda está no nível mínimo de POC: layout centralizado, textos
genéricos, `Alert` para validação, feedback limitado, ausência de comportamento keyboard-safe e
sem prova visual do JSON verificado pelo servidor.

### Documentos relacionados

- `rfcs/completed/RFC-0001-passkeys-poc-completion.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/ux-design-directions.html`

### Glossário

| Termo | Significado |
|-------|-------------|
| Calm Card | Direção visual escolhida para a tela de entrada: card simples, claro e demo-safe |
| Keyboard-Safe Form | Comportamento em que input, ações e feedback continuam acessíveis com o teclado aberto |
| Home Proof | Tela autenticada que mostra prova concreta da verificação por passkey |
| StatusMessage | Feedback inline para loading, sucesso, cancelamento e erro |
| ServerVerificationCard | Card que resume o retorno verificado pelo servidor após registro/autenticação |

## Problem Statement

A POC prova a viabilidade técnica, mas ainda não comunica bem a experiência. Para avaliadores
técnicos, falhas de HTTPS, CA, `adb reverse`, ausência de credencial ou cancelamento do prompt
podem parecer o mesmo erro genérico. Além disso, a tela autenticada não mostra evidência suficiente
de que o servidor validou a resposta WebAuthn.

**Impacto de não resolver**: a POC continua funcional, mas menos convincente em demos e menos útil
para depuração. O avaliador precisa inferir demais a partir do código ou logs.

## Goals & Non-Goals

### Goals

- Implementar a direção UX escolhida: Calm Card + Keyboard-Safe Form + Home Proof
- Usar apenas React Native primitives e estilos locais, sem biblioteca de UI adicional
- Substituir feedback via `Alert` por mensagens inline persistentes
- Manter Android Credential Manager como centro do momento de confiança
- Mostrar, na home, prova resumida de verificação do servidor (`verified`, método, username)
- Tornar erros comuns mais diagnósticos: username vazio, cancelamento, credencial ausente, setup local
- Preservar a regra de arquitetura: chamadas HTTP apenas em `services/api.ts`; passkey apenas em `app/index.tsx`

### Non-Goals

- Redesenhar o backend WebAuthn
- Adicionar gerenciamento de conta, perfil ou passkeys
- Persistir sessão com AsyncStorage ou storage seguro
- Adicionar suporte iOS
- Adicionar nova biblioteca visual
- Resolver setup de produção ou deploy em nuvem

## Evaluation Criteria

| Critério | Peso | Descrição |
|----------|------|-----------|
| Clareza do fluxo | Alto | O usuário entende criar passkey vs entrar com passkey |
| Diagnóstico de falhas | Alto | Erros apontam o provável tipo de problema sem depender de logs |
| Acessibilidade mobile | Alto | Labels visíveis, contraste, touch targets e feedback textual |
| Segurança percebida | Médio | UI prepara o handoff para o prompt nativo sem simular segurança sensível |
| Manutenibilidade | Médio | Poucos arquivos, sem dependência nova, compatível com Expo SDK 53 |
| Demo readiness | Médio | Fluxo repetível e visualmente confiável em emulador |

## Options Analysis

### Opção 1: Refinamento incremental das telas atuais

**Descrição**: Evoluir `app/index.tsx` e `app/home.tsx` com estilos locais, estado inline,
layout keyboard-safe e card de verificação, sem criar nova arquitetura visual.

**Vantagens**:
- Menor escopo e menor risco para uma POC já funcional
- Mantém a lógica de passkey concentrada em `app/index.tsx`
- Não adiciona dependências
- Facilita revisão por avaliadores técnicos

**Desvantagens**:
- Componentes podem ficar locais e menos reutilizáveis
- Não cria uma base visual extensível para produto futuro
- Teste visual ainda depende majoritariamente de execução manual no emulador

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Clareza do fluxo | Alta | Copys e hierarquia podem ser ajustadas diretamente |
| Diagnóstico de falhas | Alta | Mapeamento de mensagens pode ser implementado no fluxo atual |
| Acessibilidade mobile | Alta | RN primitives suportam labels e touch targets |
| Segurança percebida | Alta | Mantém handoff nativo sem abstrações extras |
| Manutenibilidade | Alta | Poucos arquivos e sem dependência nova |
| Demo readiness | Alta | Menor chance de quebrar o fluxo validado |

**Esforço**: Baixo a médio — 0,5 a 1 dia.

**Risco**: Baixo. O principal risco é misturar UI e fluxo assíncrono demais em `app/index.tsx`;
mitigação: separar helpers locais de estado/mensagens.

---

### Opção 2: Criar um mini design system local

**Descrição**: Criar componentes e tokens em diretórios dedicados (`components/`, `constants/` ou
`ui/`) e refatorar as telas para consumir esses blocos.

**Vantagens**:
- Melhor separação visual e reutilização
- Facilita expansão se a POC crescer
- Reduz duplicação entre entrada e home

**Desvantagens**:
- Mais arquivos e abstrações para uma superfície pequena
- Pode contrariar o objetivo de manter a POC fácil de inspecionar
- Aumenta o custo de revisão sem necessidade imediata clara

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Clareza do fluxo | Alta | Componentes nomeados ajudam a leitura |
| Diagnóstico de falhas | Média | Ainda depende do fluxo de tela |
| Acessibilidade mobile | Alta | Pode padronizar labels e touch targets |
| Segurança percebida | Alta | Sem impacto direto |
| Manutenibilidade | Média | Melhor se crescer, mais pesada se permanecer POC |
| Demo readiness | Média | Refatoração maior aumenta risco de regressão |

**Esforço**: Médio — 1 a 2 dias.

**Risco**: Médio. A abstração pode ser prematura para a escala atual.

---

### Opção 3: Introduzir biblioteca de UI

**Descrição**: Adotar biblioteca visual React Native para acelerar componentes, estados e tema.

**Vantagens**:
- Componentes prontos e consistentes
- Pode acelerar evolução futura para produto
- Alguns pacotes oferecem acessibilidade e theming padronizados

**Desvantagens**:
- Adiciona dependência não necessária para o escopo
- Pode exigir ajustes nativos ou compatibilidade com Expo
- Aumenta ruído para uma POC cujo foco é passkey/WebAuthn

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Clareza do fluxo | Média | Componentes ajudam, mas não resolvem copy/estado |
| Diagnóstico de falhas | Média | Sem benefício direto |
| Acessibilidade mobile | Média | Varia por biblioteca |
| Segurança percebida | Média | Pode competir visualmente com o prompt nativo |
| Manutenibilidade | Baixa | Nova dependência e superfície de configuração |
| Demo readiness | Média | Visual melhora, risco de setup aumenta |

**Esforço**: Médio.

**Risco**: Médio a alto para uma POC local. Descartável enquanto o escopo permanecer pequeno.

## Recommendation

**Opção 1: Refinamento incremental das telas atuais**

Esta opção atende aos critérios de clareza, diagnóstico, acessibilidade e demo readiness com o
menor risco sobre o fluxo técnico já validado pela RFC-0001. A decisão aceita o trade-off de menor
reutilização inicial para preservar simplicidade, auditabilidade e ausência de novas dependências.

---

## Technical Design

### Direção visual

Implementar a combinação definida pela especificação UX:

- **Entry**: Calm Card com hero de passkey, explicação curta, username, ações e status inline
- **Focused input**: Keyboard-Safe Form com `KeyboardAvoidingView` + `ScrollView`
- **Home**: Home Proof com username, status autenticado, método `passkey` e resumo do retorno do servidor

### Paleta e tokens locais

Usar os valores definidos na especificação:

| Uso | Valor |
|-----|-------|
| Background | `#F8FAFC` |
| Surface | `#FFFFFF` |
| Text primary | `#0F172A` |
| Text secondary | `#475569` |
| Border | `#CBD5E1` |
| Primary | `#2563EB` |
| Primary pressed | `#1D4ED8` |
| Success | `#16A34A` |
| Error | `#DC2626` |
| Info surface | `#EFF6FF` |
| Error surface | `#FEF2F2` |

### Entry screen

`passkeys-app/app/index.tsx` deve manter o import de `react-native-passkey` neste arquivo e
continuar chamando `services/api.ts` para todas as requisições.

Comportamentos esperados:

- Validar username vazio antes de qualquer chamada ao servidor ou prompt nativo
- Exibir mensagem pré-dialog: Android pedirá confirmação por biometria/bloqueio de tela
- Desabilitar botões enquanto `loading`
- Trocar `Alert.alert` por `StatusMessage` inline
- Diferenciar, quando possível, cancelamento, ausência de credencial e setup local
- Navegar para `/home` com dados suficientes para renderizar o proof state

### Home screen

`passkeys-app/app/home.tsx` deve mostrar:

- username autenticado
- `verified: true` quando o servidor confirmar
- método `passkey`
- tipo de resposta `JSON`
- botão de logout que retorna à entrada sem apagar a passkey

### API service

`passkeys-app/services/api.ts` permanece como único ponto de HTTP. Se necessário para UX, pode
melhorar erros lançados por `postJSON`, mas sem inserir lógica de passkey ou UI no service.

### Acessibilidade

Requisitos mínimos:

- label visível para username
- `autoCapitalize="none"` e `autoCorrect={false}`
- botões com altura mínima de 44px
- estado não indicado apenas por cor
- loading textual junto do spinner
- mensagens de erro persistentes até a próxima ação

## Implementation Plan

### Fase 1 — UX do app Android

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 1.1 | `passkeys-app/app/index.tsx` | Implementar Calm Card, status inline, copy de passkey e ações claras |
| 1.2 | `passkeys-app/app/index.tsx` | Implementar Keyboard-Safe Form com `KeyboardAvoidingView` e `ScrollView` |
| 1.3 | `passkeys-app/app/index.tsx`, `passkeys-app/services/api.ts` | Refinar feedback de loading, sucesso, cancelamento e erros diagnósticos |
| 1.4 | `passkeys-app/app/home.tsx` | Implementar Home Proof com resumo da verificação do servidor |

**Arquivo de tasks**: `tasks/rfc-0002/fase-1-ux-app.md`  
**Critério de conclusão**: `cd passkeys-app && npm test && npm run lint`

### Fase 2 — Validação UX e E2E

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 2.1 | `passkeys-app/services/__tests__/api.test.ts` | Ajustar testes unitários caso o shape de erros do service mude |
| 2.2 | — | Validar registro e login no emulador Android com teclado visível |
| 2.3 | — | Validar cancelamento do prompt nativo e servidor indisponível |
| 2.4 | `tasks/rfc-0002/fase-2-ux-validacao.md` | Registrar evidências e gaps no próprio arquivo de fase (campo Notas) |

**Arquivo de tasks**: `tasks/rfc-0002/fase-2-ux-validacao.md`  
**Critério de conclusão**: fluxo manual no emulador confirma registro → home proof → logout → login → home proof, e `cd passkeys-app && npm test && npm run lint` passa.

### Fase 3 — Documentação

Última fase da RFC-0002. Executada após a Fase 2 estar `[x] completed`.  
**Arquivo de tasks**: `tasks/rfc-0002/fase-3-documentacao.md`.

Escopo fixo:
- Atualizar `CLAUDE.md` somente se houver setup não óbvio novo
- Atualizar README do app, se existir seção de uso/demo afetada
- Mover esta RFC para `rfcs/completed/` e preencher `## Decision Record`

**Critério de conclusão**: um novo avaliador consegue entender e demonstrar o fluxo UX lendo a documentação relevante.

### Rollback

O rollback é restrito ao app:

- Reverter `passkeys-app/app/index.tsx` para a tela simples anterior
- Reverter `passkeys-app/app/home.tsx` para a home simples anterior
- Reverter mudanças em `passkeys-app/services/api.ts` se o shape de erro for alterado

Nenhuma mudança de backend é prevista.

## Open Questions

1. **Dados da verificação na rota `/home`**: passar via route params é suficiente para a POC ou vale criar estado compartilhado simples? A recomendação inicial é route params para evitar storage.
2. **Granularidade de erros do passkey nativo**: confirmar quais mensagens/códigos `react-native-passkey` expõe em cancelamento e credencial ausente.
3. **ServerVerificationCard**: exibir apenas resumo (`verified`, método, username) ou incluir trecho do JSON bruto? A recomendação inicial é resumo para manter legibilidade.
4. **Screenshots de validação**: decidir se a Fase 2 (validação) deve anexar screenshots manuais ou apenas checklist textual.

## Decision Record

- **Data**: 2026-04-25  
- **Decisão**: Manter a **Opção 1 (refinamento incremental)** descrita em "Recommendation" — implementação concluída sem biblioteca de UI adicional, com HTTP apenas em `services/api.ts` e `react-native-passkey` apenas em `app/index.tsx`, conforme `AGENTS.md`.  
- **Entregas verificadas**: Tela de entrada (Calm Card, status inline, formulário keyboard-safe), Home Proof em `app/home.tsx`, testes e lint do app (`tasks/rfc-0002/fase-1-ux-app.md`, `fase-2-ux-validacao.md`), documentação e este arquivo em `rfcs/completed/`.  
- **Open questions (resolução na implementação)**:
  1. Dados em `/home`: **route params** após `verifyRegistration` / `verifyAuthentication` — suficiente para a POC.  
  2. Erros nativos: tratamento via helpers locais (cancelamento, rede, HTTP) alinhado a `react-native-passkey` e respostas do servidor.  
  3. Prova do servidor: **resumo** (`verified`, método, username, tipo de resposta) — sem JSON bruto na UI.  
  4. Validação: evidências em **Notas** da fase 2 (checklist; sem requisito de screenshots no harness).  
- **Não escopo (confirmado)**: sem mudança de backend WebAuthn, sem iOS, sem persistência de sessão, sem nova dependência visual.
