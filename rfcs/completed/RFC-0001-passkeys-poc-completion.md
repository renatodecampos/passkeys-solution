---
rfc_id: RFC-0001
title: Conclusão da POC de Passkeys — HTTPS Local + Android
status: COMPLETED
author: Renato de Campos
reviewers: []
created: 2026-04-24
last_updated: 2026-04-24
decision_date: 2026-04-24
---

# RFC-0001: Conclusão da POC de Passkeys — HTTPS Local + Android

## Overview

Esta RFC especifica o plano técnico para concluir a prova de conceito (POC) de autenticação
passwordless com WebAuthn/Passkeys. O sistema já possui um backend Fastify funcional com os
4 endpoints do protocolo WebAuthn. O que falta é: (a) HTTPS local com certificado auto-assinado,
(b) integração de passkeys no app Android, e (c) a configuração de confiança mútua entre o
emulador Android e o servidor local.

O escopo é deliberadamente restrito: servidor na máquina local (macOS), cliente Android em emulador,
sem infraestrutura de nuvem, sem certificados pagos.

## Background & Context

### Estado atual do projeto

```
passkeys/
├── passkeys-server/        # Backend Fastify + TypeScript — ~80% completo
│   └── src/
│       ├── registration/   # generateOptions + verifyRegistration ✓
│       ├── authentication/ # generateOptions + verifyAuthentication ✓
│       └── infra/api/      # 4 endpoints WebAuthn + assetlinks.json ✓
└── passkeys-app/           # Expo + React Native — ~5% completo (template)
    └── app/                # Sem nenhum código de passkeys
```

### Restrições WebAuthn relevantes

- WebAuthn exige **HTTPS** em qualquer origem que não seja `localhost` literal
- O `RP_ID` deve ser um domínio registrável (não IP)
- Android Credential Manager valida a associação app↔servidor via **Digital Asset Links**
  (`/.well-known/assetlinks.json`) — o endpoint já existe no server
- O SHA-256 do Digital Asset Links referencia o **keystore do app**, não o certificado TLS

### Glossário

| Termo | Significado |
|-------|-------------|
| RP_ID | Relying Party ID — domínio que "possui" as credenciais passkey |
| RP_ORIGIN | Origem completa (scheme + host + port) onde o app está rodando |
| mkcert | Ferramenta que cria uma CA local aceita pelo sistema operacional |
| adb reverse | Comando ADB que faz port forwarding do emulador para o host |
| Digital Asset Links | Arquivo JSON que associa um app Android a um domínio web |
| Credential Manager | API Android (>=9) usada para criar/usar passkeys |

## Problem Statement

O app não tem nenhum código de autenticação por passkeys. O server roda apenas em HTTP.
Sem HTTPS, o Android Credential Manager recusa o fluxo WebAuthn. Sem a confiança no
certificado auto-assinado, o app recusa conexões TLS. Sem a associação Digital Asset Links,
o Android recusa a criação da passkey.

**Impacto de não resolver**: a POC não pode ser executada end-to-end em nenhum cenário realista.

## Goals & Non-Goals

### Goals

- Servidor Fastify servindo HTTPS com certificado auto-assinado gerado por mkcert
- App Android capaz de registrar e autenticar com passkeys
- Emulador Android confiando no certificado TLS do servidor
- Fluxo completo testável: registro → autenticação → feedback visual no app
- Estrutura de testes que valide cada camada independentemente

### Non-Goals

- Deploy em nuvem ou ambiente de produção
- Suporte a iOS
- Suporte a dispositivo físico Android (apenas emulador)
- Certificados pagos ou de autoridades públicas
- Múltiplos usuários simultâneos / testes de carga

## Evaluation Criteria

| Critério | Peso | Descrição |
|----------|------|-----------|
| Complexidade de setup | Alto | Menor número de passos manuais |
| Compatibilidade WebAuthn | Alto | RP_ID válido, origem HTTPS correta |
| Confiança TLS no Android | Alto | Sem erros de certificado no emulador |
| Manutenibilidade | Médio | Fácil de recriar em nova máquina |
| Velocidade de iteração | Médio | Reload/rebuild ágil durante desenvolvimento |

## Options Analysis

### Opção 1: `localhost` + `adb reverse` + mkcert

**Descrição**: O servidor escuta em `localhost:3000` com HTTPS (cert mkcert para `localhost`).
O comando `adb reverse tcp:3000 tcp:3000` faz o emulador enxergar `localhost:3000` como o host.
`RP_ID=localhost`, `RP_ORIGIN=https://localhost:3000`.

**Vantagens**:
- `localhost` é tratado como origem segura pelo WebAuthn — sem restrições especiais
- `adb reverse` não requer configuração de DNS ou IP
- mkcert gera cert para `localhost` nativamente
- Configuração reproduzível em qualquer máquina

**Desvantagens**:
- Requer que o emulador esteja iniciado antes de rodar `adb reverse`
- `adb reverse` precisa ser reexecutado se o emulador reiniciar
- Não funciona em dispositivo físico sem adaptação

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Complexidade de setup | Alta | 3 comandos: mkcert + adb reverse + iniciar server |
| Compatibilidade WebAuthn | Total | localhost é origem privilegiada |
| Confiança TLS no Android | Requer config | network_security_config.xml + CA do mkcert |
| Manutenibilidade | Alta | Documentável em 5 linhas |
| Velocidade de iteração | Alta | Hot reload funciona normalmente |

**Esforço**: Baixo — ~2h de configuração

**Risco**: Baixo. O único risco é o mkcert CA não ser instalado corretamente no emulador,
mitigável com `adb push` do rootCA + reinício do emulador.

---

### Opção 2: Hostname customizado (`passkeys.local`) + DNS manual

**Descrição**: Criar hostname `passkeys.local` no `/etc/hosts` do Mac e no emulador.
mkcert gera cert para `passkeys.local`. `RP_ID=passkeys.local`.

**Vantagens**:
- Simula um domínio real, mais próximo do comportamento de produção
- Funciona com dispositivo físico se conectado na mesma rede Wi-Fi

**Desvantagens**:
- Modificar `/etc/hosts` do emulador Android requer emulador com acesso root ou Google Pixel API
- IP do Mac pode mudar (DHCP), quebrando a configuração
- Mais passos de setup

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Complexidade de setup | Média | Requer root no emulador ou AVD específico |
| Compatibilidade WebAuthn | Total | Domínio válido |
| Confiança TLS no Android | Requer config | Mesma config de network_security + DNS |
| Manutenibilidade | Média | IP pode mudar |
| Velocidade de iteração | Média | Mais variáveis para depurar |

**Esforço**: Médio — ~4h de configuração

**Risco**: Médio. Problemas de DNS e IP dinâmico podem causar intermitências.

---

### Opção 3: ngrok (túnel HTTPS público)

**Descrição**: Usar ngrok para expor o servidor local via HTTPS com certificado válido de AC pública.

**Vantagens**:
- Certificado confiável automaticamente — sem configuração de CA no Android
- Funciona em dispositivo físico e emulador sem config extra

**Desvantagens**:
- Requer conexão com internet (viola o requisito "somente local")
- URL muda a cada reinício (plano gratuito)
- Latência adicional

**Avaliação contra critérios**:
| Critério | Avaliação | Notas |
|----------|-----------|-------|
| Complexidade de setup | Alta | 1 comando |
| Compatibilidade WebAuthn | Total | HTTPS válido |
| Confiança TLS no Android | Automática | AC pública |
| Manutenibilidade | Baixa | URL instável, depende de internet |
| Velocidade de iteração | Alta | — |

**Esforço**: Muito baixo — 15 min

**Risco**: Alto para o requisito de "somente local". Descartado como opção principal.

## Recommendation

**Opção 1: `localhost` + `adb reverse` + mkcert**

Menor complexidade, total compatibilidade com WebAuthn, e todos os componentes
são reproduzíveis localmente sem dependências externas. O custo de reexecutar
`adb reverse` após reinício do emulador é aceitável em contexto de POC.

---

## Technical Design

### Arquitetura do sistema

```
┌─────────────────── macOS ───────────────────┐
│                                             │
│  docker-compose                             │
│  ├── mongodb:27017                          │
│  └── redis:6379                             │
│                                             │
│  passkeys-server (Node.js)                  │
│  └── https://localhost:3000                 │
│       ├── POST /generate-registration-options│
│       ├── POST /verify-registration          │
│       ├── POST /generate-authentication-options│
│       ├── POST /verify-authentication        │
│       └── GET  /.well-known/assetlinks.json  │
│                                             │
│  mkcert CA ──────────────────────────────┐  │
│  cert: localhost+1.pem                   │  │
│  key:  localhost+1-key.pem               │  │
└──────────────────────────────────────────┼──┘
                                           │ adb reverse tcp:3000 tcp:3000
┌──────── Android Emulator ────────────────┼──┐
│                                          │  │
│  passkeys-app (Expo + React Native)      │  │
│  └── https://localhost:3000 ←────────────┘  │
│       network_security_config.xml            │
│       └── trust-anchors: mkcert rootCA       │
│                                             │
│  Android Credential Manager                 │
│  └── passkey scope: localhost               │
└─────────────────────────────────────────────┘
```

### Configurações de ambiente

**passkeys-server/.env**
```env
RP_ID=localhost
RP_NAME=Passkeys POC
RP_ORIGIN=https://localhost:3000
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017
DB_NAME=passkeys
COLLECTION_NAME=users
REDIS_URL=redis://localhost:6379
SESSION_SECRET=<32-bytes-hex>
LOG_LEVEL=debug
NODE_ENV=development
ANDROID_CERT_FINGERPRINT=<sha256-do-debug-keystore>
```

### Modificações no servidor

#### `passkeys-server/src/index.ts`
Carregar certificados TLS e passar para o Fastify:

```typescript
import fs from 'fs';
import path from 'path';

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/localhost+1-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/localhost+1.pem')),
};

const server = fastify({
  https: httpsOptions,
  logger: false,
});
```

#### `passkeys-server/src/infra/api/index.ts`
Adicionar `cookie.secure: true` independente de ambiente (agora sempre HTTPS):

```typescript
server.register(fastifySession, {
  secret: SESSION_KEY,
  cookieName: 'sessionId',
  cookie: {
    maxAge: 1800000,
    secure: true, // sempre true — server é sempre HTTPS agora
  },
});
```

Adicionar endpoint iOS (não será testado, mas completa a especificação):

```typescript
server.get('/.well-known/apple-app-site-association', async (request, reply) => {
  reply.send({
    webcredentials: {
      apps: ['TEAMID.com.anonymous.passkeys'],
    },
  });
});
```

### Modificações no app

#### Novo arquivo: `android/app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <debug-overrides>
    <trust-anchors>
      <!-- Confia na CA do sistema (inclui mkcert após instalação) -->
      <certificates src="system"/>
      <!-- Confia em CAs instaladas pelo usuário no emulador -->
      <certificates src="user"/>
    </trust-anchors>
  </debug-overrides>
</network-security-config>
```

#### `android/app/src/main/AndroidManifest.xml`
Referenciar a config de segurança:
```xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  ...>
```

#### Novo arquivo: `passkeys-app/services/api.ts`
```typescript
const BASE_URL = 'https://localhost:3000';

export const generateRegistrationOptions = (username: string) =>
  fetch(`${BASE_URL}/generate-registration-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }).then(r => r.json());

export const verifyRegistration = (username: string, response: unknown) =>
  fetch(`${BASE_URL}/verify-registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
    body: JSON.stringify(response),
  }).then(r => r.json());

export const generateAuthenticationOptions = (username: string) =>
  fetch(`${BASE_URL}/generate-authentication-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
  }).then(r => r.json());

export const verifyAuthentication = (username: string, response: unknown) =>
  fetch(`${BASE_URL}/verify-authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-username': username },
    body: JSON.stringify(response),
  }).then(r => r.json());
```

#### Telas do app

**`passkeys-app/app/index.tsx`** — tela de entrada (login/registro):
- Input de username
- Botão "Registrar" → chama `generateRegistrationOptions` + `react-native-passkey` + `verifyRegistration`
- Botão "Entrar" → chama `generateAuthenticationOptions` + `react-native-passkey` + `verifyAuthentication`
- Navega para `/(tabs)` após sucesso

**`passkeys-app/app/(tabs)/index.tsx`** — home autenticado:
- Exibe username logado (via estado ou AsyncStorage)
- Botão de logout

### Biblioteca de passkeys

Usar `react-native-passkey` (pacote: `react-native-passkey`, autor: f-23):

```bash
npx expo install react-native-passkey
npx expo prebuild --platform android
```

API esperada:
```typescript
import { Passkey } from 'react-native-passkey';

// Registro
const credential = await Passkey.create(registrationOptionsJSON);

// Autenticação
const assertion = await Passkey.get(authenticationOptionsJSON);
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

## Implementation Plan

### Fase 1 — Infraestrutura e HTTPS (server) ✓ CONCLUÍDA

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 1.1 | `docker-compose.yml` | Criar na raiz do projeto |
| 1.2 | `passkeys-server/certs/` | Gerar certificados com mkcert |
| 1.3 | `passkeys-server/src/index.ts` | Habilitar HTTPS no Fastify |
| 1.4 | `passkeys-server/src/infra/api/index.ts` | `cookie.secure: true`, endpoint AASA |
| 1.5 | `passkeys-server/.env` | Configurar RP_ID=localhost, RP_ORIGIN=https://localhost:3000 |
| 1.6 | `passkeys-server/.gitignore` | Excluir `certs/` do git |

**Critério de conclusão**: `curl -k https://localhost:3000/health` retorna `{"status":"ok"}` ✓

### Fase 1b — Testes Unitários do Server

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 1b.1 | `jest.config.ts`, `package.json` | Setup Jest + ts-jest com cobertura |
| 1b.2 | `src/registration/__tests__/index.test.ts` | 5 casos de teste para registration |
| 1b.3 | `src/authentication/__tests__/index.test.ts` | 5 casos de teste para authentication |
| 1b.4 | — | Verificação de cobertura ≥ 80% |

**Critério de conclusão**: `npm test` — todos os testes passam, cobertura ≥ 80% em `registration/` e `authentication/`

**Estratégia de mock**: dependências externas (`database`, `redis`, `@simplewebauthn/server`) são mockadas via `jest.mock()` inline em cada arquivo de teste. Sem `__mocks__` globais.

### Fase 2 — App Android

| Passo | Arquivo(s) | Descrição |
|-------|-----------|-----------|
| 2.1 | `passkeys-app/package.json` | Instalar `react-native-passkey` |
| 2.2 | — | `expo prebuild --platform android` |
| 2.3 | `android/app/src/main/res/xml/network_security_config.xml` | Confiança em CAs de usuário |
| 2.4 | `android/app/src/main/AndroidManifest.xml` | Referenciar network_security_config |
| 2.5 | `passkeys-app/services/api.ts` | Cliente HTTP para o server |
| 2.6 | `passkeys-app/app/index.tsx` | Tela de login/registro |
| 2.7 | `passkeys-app/app/(tabs)/index.tsx` | Tela home autenticado |
| 2.8 | `passkeys-app/services/__tests__/api.test.ts` | Testes unitários do cliente HTTP |

**Critério de conclusão**: App compila sem erros no emulador Android API 34+ e `npm test` no app passa

### Fase 3 — Integração e testes E2E

| Passo | Descrição |
|-------|-----------|
| 3.1 | Obter SHA256 do debug keystore e configurar `ANDROID_CERT_FINGERPRINT` |
| 3.2 | Instalar mkcert rootCA no emulador via `adb push` |
| 3.3 | Executar `adb reverse tcp:3000 tcp:3000` |
| 3.4 | Iniciar infra (docker-compose) e server |
| 3.5 | Build e install do app no emulador |
| 3.6 | Teste E2E: registrar usuário |
| 3.7 | Teste E2E: autenticar usuário |

**Critério de conclusão**: Fluxo completo registro → autenticação executado com sucesso no emulador

### Rollback

Cada fase é independente. Reverter uma fase não afeta as demais:
- Fase 1: reverter `index.ts` para HTTP remove HTTPS sem afetar o app
- Fase 2: `expo prebuild` pode ser executado novamente do zero
- Fase 3: procedimentos manuais, sem estado persistente

## Open Questions

1. **`react-native-passkey` vs alternativas**: Confirmar que `react-native-passkey` (f-23) suporta
   Expo SDK 53 + React Native 0.79. Alternativas: `@react-native-passkeys/passkeys` ou implementação
   direta via `expo-modules-core`.

2. **Digital Asset Links em localhost**: O Android Credential Manager valida
   `/.well-known/assetlinks.json` em `localhost`? Precisa de verificação empírica —
   pode exigir flag de desenvolvimento ou emulador sem Play Protect.

3. **Versão mínima do Android**: Passkeys via Credential Manager requerem Android 9 (API 28).
   Confirmar que a imagem do AVD utilizada é API 28+.

4. **Estado de autenticação no app**: Usar `AsyncStorage` ou apenas estado em memória (React state)
   para a POC? Memória é suficiente para POC, mas perde o estado ao recarregar.

5. **`expo-dev-client` vs Expo Go**: `react-native-passkey` requer módulos nativos,
   portanto requer `expo-dev-client` (já instalado) — não funciona com Expo Go.

## Decision Record

**Decisão**: Opção 1 (`localhost` + `adb reverse` + mkcert) implementada conforme especificado.

**Data**: 2026-04-24

**Principais pontos**:

- mkcert + `adb reverse` funcionou conforme esperado. O cert `localhost+2.pem` foi gerado com 3 SANs; o server carrega via `passkeys-server/certs/`.
- `react-native-passkey` v3.3.3 é compatível com Expo SDK 53 / RN 0.79 sem alterações.
- O debug keystore está em `passkeys-app/android/app/debug.keystore` (não no `~/.android/`). SHA256 registrado em `ANDROID_CERT_FINGERPRINT`.
- `ANDROID_ORIGIN` foi necessário além de `RP_ORIGIN` para o Android Credential Manager aceitar a criação de passkey.
- `generate-authentication-options` exige body `{}` explícito — enviar `undefined` retorna erro 400.
- Tela home movida para `app/home.tsx` para resolver ambiguidade de rota entre `app/index.tsx` e `app/(tabs)/index.tsx`.
- Fluxo completo (registro + autenticação) executado com sucesso: biometria solicitada, passkey criada, tela home exibida, logout, reautenticação com mesmo username.
- Gradle 7.3.3 incompatível com Expo SDK 53: resolvido atualizando `sdkVersion` de `45.0.0` para `53.0.0` em `app.json` e rodando `expo prebuild --clean`.
