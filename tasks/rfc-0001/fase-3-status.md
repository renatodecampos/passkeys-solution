# Fase 3 — Integração, Certificados no Emulador e Testes E2E

**Status da fase**: `[x] completed`
**Agente responsável**: Cursor Agent (Sonnet 4.6)
**Iniciado em**: 2026-04-24T15:00:00Z
**Concluído em**: 2026-04-24T15:45:00Z

---

## Pré-requisito

Fase 2 deve estar `[x] completed` antes de iniciar esta fase.

---

## Critério de conclusão

Fluxo completo executado com sucesso no emulador Android:
1. Usuário digita username → toca "Registrar" → biometria solicitada → passkey criada → tela home exibida
2. Usuário toca "Logout" → toca "Entrar" com mesmo username → biometria solicitada → autenticado → tela home exibida

---

## Subtarefas

### 3.1 — Obter SHA256 do debug keystore
- **Status**: `[x] completed`
- **depends_on**: []
- **O que fazer**:
  ```bash
  keytool -list -v \
    -keystore ~/.android/debug.keystore \
    -alias androiddebugkey \
    -storepass android \
    -keypass android
  ```
  Copiar o valor `SHA256:` (formato `AA:BB:CC:...`) para `ANDROID_CERT_FINGERPRINT` no `.env`
- **Verificação**: `curl -k https://localhost:3000/.well-known/assetlinks.json` retorna o fingerprint correto

### 3.2 — Instalar mkcert CA no emulador
- **Status**: `[x] completed`
- **depends_on**: []
- **O que fazer**:
  1. Obter caminho da rootCA: `mkcert -CAROOT` → anote o diretório
  2. Com emulador rodando:
     ```bash
     adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem
     ```
  3. No emulador: Settings → Security → Install from storage → selecionar `rootCA.pem`
  4. Confirmar instalação como "CA certificate"
- **Verificação**: Settings → Security → Trusted credentials → User → mostra "org-mkcert development CA"
- **Atenção**: Requer emulador com Play Store desabilitado (imagens "Google APIs" funcionam; "Google Play" pode bloquear CAs de usuário em builds release, mas não em debug com network_security_config correto)

### 3.3 — adb reverse port forwarding
- **Status**: `[x] completed`
- **depends_on**: []
- **O que fazer**:
  ```bash
  adb reverse tcp:3000 tcp:3000
  ```
- **Verificação**: `adb reverse --list` mostra `tcp:3000 tcp:3000`
- **Nota**: Este comando precisa ser reexecutado toda vez que o emulador reiniciar. Documentar no README de desenvolvimento.

### 3.4 — Iniciar infraestrutura e server
- **Status**: `[x] completed`
- **depends_on**: [3.1, 3.2, 3.3]
- **O que fazer**:
  ```bash
  # Na raiz do projeto
  docker-compose up -d

  # No diretório do server
  cd passkeys-server && npm run dev
  ```
- **Verificação**:
  ```bash
  curl -k https://localhost:3000/health
  # {"status":"ok"}
  ```

### 3.5 — Build e install do app no emulador
- **Status**: `[x] completed`
- **depends_on**: [3.2, 3.3, 3.4]
- **O que fazer**:
  ```bash
  cd passkeys-app
  npx expo run:android
  ```
- **Verificação**: App abre no emulador sem crash na tela de login/registro

### 3.6 — Teste E2E: Registro
- **Status**: `[x] completed`
- **depends_on**: [3.5]
- **O que fazer**:
  1. No app, digitar um username (ex: `testuser`)
  2. Tocar "Registrar"
  3. Aceitar o prompt de biometria/passkey
  4. Verificar que a tela home é exibida com o username
- **Verificação**:
  - App exibe tela home com username
  - Log do server mostra `Registration options generated` e `Credential added to user`
  - MongoDB tem o documento do usuário com `credentials` não vazio

### 3.7 — Teste E2E: Autenticação
- **Status**: `[x] completed`
- **depends_on**: [3.6]
- **O que fazer**:
  1. Tocar "Logout"
  2. Digitar o mesmo username
  3. Tocar "Entrar"
  4. Aceitar o prompt de biometria/passkey
  5. Verificar que a tela home é exibida
- **Verificação**:
  - App exibe tela home
  - Log do server mostra `Authentication verified for user`

---

## Parallelism map

```
3.1 ─┐
3.2 ─┤─→ 3.4 → 3.5 → 3.6 → 3.7
3.3 ─┘
```

Subtarefas 3.1, 3.2 e 3.3 podem ser iniciadas simultaneamente.

---

## Instruções para o Orquestrador

> Estas instruções são lidas automaticamente quando você executa `/feature-dev execute RFC-0001 fase 3`

**Pré-condição**: verifique que `tasks/rfc-0001/fase-2-status.md` está `[x] completed`. Se não estiver, pare e informe.

**Ao iniciar**: atualize o cabeçalho deste arquivo — `Status da fase` para `[~] in_progress`, `Agente responsável` com seu nome, `Iniciado em` com timestamp ISO.

> **Atenção**: Esta fase envolve comandos manuais no emulador Android (instalar CA, configurar biometria).
> O agente executa os comandos de terminal onde possível e instrui o usuário para as etapas interativas.

### BATCH A — paralelo
Dispare três sub-agentes **simultaneamente**:

**Sub-agente 1 — fingerprint do keystore**
- Execute:
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- Extraia o valor `SHA256:` (formato `AA:BB:CC:...`)
- Registre o valor no campo Notas deste arquivo
- Instrua o usuário a colocar o valor em `ANDROID_CERT_FINGERPRINT` no `passkeys-server/.env`
- Marque 3.1 `[x] completed`

**Sub-agente 2 — instalar CA no emulador**
- Verifique que o emulador está rodando: `adb devices`
- Execute:
  ```bash
  adb push "$(mkcert -CAROOT)/rootCA.pem" /sdcard/rootCA.pem
  ```
- Instrua o usuário a instalar manualmente: Settings → Security → Install from storage → rootCA.pem
- Marque 3.2 `[~] in_progress` e registre instrução manual nas Notas
- Após confirmação do usuário: marque 3.2 `[x] completed`

**Sub-agente 3 — port forwarding**
- Execute: `adb reverse tcp:3000 tcp:3000`
- Verifique: `adb reverse --list` mostra `tcp:3000 tcp:3000`
- Marque 3.3 `[x] completed`

**Aguarde os três** antes de avançar.

### BATCH B — sequencial
Execute **3.4**:
- Inicie a infraestrutura: `docker-compose up -d`
- Inicie o server: `cd passkeys-server && npm run dev`
- Verifique: `curl -k https://localhost:3000/health` → `{"status":"ok"}`
- Marque 3.4 `[x] completed`

### BATCH C — sequencial
Execute **3.5**:
- `cd passkeys-app && npx expo run:android`
- App abre no emulador sem crash
- Marque 3.5 `[x] completed`

### BATCH D — sequencial (testes manuais com usuário)
Execute **3.6** e **3.7** em sequência, instruindo o usuário a operar o emulador:

- **3.6**: Instrua o usuário a registrar um passkey. Monitore os logs do server.
  Critério: log mostra `Credential added to user`, tela home é exibida.
  Marque 3.6 `[x] completed`

- **3.7**: Instrua o usuário a fazer logout e autenticar. Monitore os logs do server.
  Critério: log mostra `Authentication verified for user`, tela home é exibida.
  Marque 3.7 `[x] completed`

### Finalização
- Todos completos → atualize `Status da fase` para `[x] completed` com `Concluído em`
- Algum bloqueio → atualize `Status da fase` para `[!] blocked` e registre em Blockers

---

## Blockers

Resolvidos durante execução:
- **Gradle 7.3.3 incompatível com Expo SDK 53**: corrigido atualizando `sdkVersion` no `app.json` de `45.0.0` para `53.0.0` e rodando `expo prebuild --clean`.
- **Origin WebAuthn rejeitada**: server aceitava apenas `https://localhost:3000`; adicionado `ANDROID_ORIGIN=android:apk-key-hash:...` ao `.env` e `expectedOrigins[]` no server.
- **Body vazio em `generate-authentication-options`**: `services/api.ts` enviava body `undefined`; corrigido para `{}`.
- **Navegação de logout presa**: ambiguidade de rota entre `app/index.tsx` e `app/(tabs)/index.tsx`; resolvido movendo tela home para `app/home.tsx`.

---

## Notas

### Troubleshooting comum

**Erro de certificado no app (SSL_ERROR_RX_RECORD_TOO_LONG ou similar)**
→ Verificar se `adb reverse` está ativo e se a CA do mkcert está instalada no emulador

**Passkey não aparece para autenticação**
→ Verificar se o username é exatamente o mesmo usado no registro (case sensitive)

**Digital Asset Links falha**
→ Verificar SHA256 no `.env` e reiniciar o server

**Android Credential Manager recusa criar passkey**
→ Verificar se o emulador tem biometria configurada: Settings → Security → Fingerprint → adicionar impressão digital virtual

### Resultados BATCH A (2026-04-24T15:00:00Z)

**3.1 — SHA256 do debug keystore**
- Keystore encontrado em: `passkeys-app/android/app/debug.keystore` (não em `~/.android/debug.keystore`)
- SHA256: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`
- Valor atualizado em `passkeys-server/.env` → `ANDROID_CERT_FINGERPRINT`

**3.2 — CA mkcert**
- Dispositivo físico conectado: `RQ8Y503JEQX` (USB)
- CAROOT: `/Users/renatodecampos/Library/Application Support/mkcert`
- `adb push` executado com sucesso → `rootCA.pem` em `/sdcard/rootCA.pem`
- **Ação manual pendente**: Settings → Security → Install from storage → rootCA.pem → instalar como "CA certificate"

**3.3 — Port forwarding**
- `adb reverse tcp:3000 tcp:3000` → sucesso (`UsbFfs tcp:3000 tcp:3000`)

---

## Token Usage

> Preencha com o valor exibido na UI do Claude Code ou Cursor ao final da fase.

| Campo | Valor |
|-------|-------|
| Ferramenta | Cursor (Sonnet 4.6) |
| Tokens consumidos | — |
| Observação | — |
