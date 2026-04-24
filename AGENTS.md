# AGENTS.md

Convenções para agentes (Claude Code, Cursor, ou qualquer LLM) trabalhando neste repositório.
Estas regras têm precedência sobre comportamentos padrão dos agentes.

---

## 0. Como usar este harness

### Executar uma fase existente

Abra uma nova janela de contexto e use:

```
/feature-dev execute a fase <número>
```

O agente localiza o arquivo `tasks/fase-<número>-status.md`, lê a seção
**"Instruções para o Orquestrador"** e executa. Cada arquivo é autossuficiente.

| Comando | Arquivo lido |
|---------|-------------|
| `/feature-dev execute a fase 1b` | `tasks/fase-1b-testes-server.md` |
| `/feature-dev execute a fase 2`  | `tasks/fase-2-status.md` |
| `/feature-dev execute a fase 3`  | `tasks/fase-3-status.md` |
| `/feature-dev execute a fase 4`  | `tasks/fase-4-documentacao.md` |

---

### Criar harness para uma nova RFC

**Não recrie a infraestrutura.** `AGENTS.md`, `CLAUDE.md` e `tasks/README.md` são
permanentes e compartilhados por todas as RFCs.

Para uma nova RFC, use:

```
/feature-dev cria harness para a RFC-{{NUMERO}}
```

O agente deve:

1. **Criar a RFC** em `rfcs/draft/RFC-{{NUMERO}}-{{slug}}.md`
   - Usar `rfcs/_template-rfc.md` como base
   - Preencher todas as seções com o conteúdo da iniciativa

2. **Criar os arquivos de fase** em `tasks/`
   - Um arquivo por fase definida na RFC
   - Usar `tasks/_template-fase.md` como base para cada um
   - Nomenclatura: `fase-{{NUMERO}}-{{slug}}.md` (ex: `fase-4-auth-social.md`)
   - Preencher subtarefas, parallelism map e instruções do orquestrador

3. **Atualizar `tasks/README.md`**
   - Adicionar linha na tabela de fases para cada novo arquivo criado

4. **Atualizar a tabela de comandos** na seção 0 deste arquivo (`AGENTS.md`)
   - Adicionar a linha `/feature-dev execute a fase X → tasks/fase-X-...md`

**O que NÃO fazer ao criar harness:**
- Não modifique fases de outras RFCs
- Não altere `CLAUDE.md`
- Não renomeie arquivos de fases já existentes

---

## 1. Leitura obrigatória antes de qualquer tarefa

Antes de escrever qualquer linha de código, leia:

1. `CLAUDE.md` — visão geral do projeto, comandos e arquitetura
2. O arquivo de status da fase em que você está trabalhando (`tasks/fase-X-status.md`)
3. A RFC do plano: `rfcs/draft/RFC-0001-passkeys-poc-completion.md`

---

## 2. Regras de atualização de status

Todo agente **deve** atualizar o arquivo de status da sua fase antes de começar e ao concluir cada subtarefa.

### Formato de status

```
[ ] pending      — ainda não iniciado
[~] in_progress  — em andamento (inclua timestamp ISO e qual agente)
[x] completed    — concluído e verificado
[!] blocked      — bloqueado (descreva o motivo na linha abaixo)
[-] skipped      — ignorado com justificativa
```

### Regra de bloqueio

Se uma subtarefa estiver bloqueada:
1. Marque `[!] blocked` com descrição do motivo
2. NÃO avance para subtarefas dependentes
3. NÃO tente contornar o bloqueio silenciosamente
4. Registre a dependência no campo `## Blockers` do arquivo de status

### Regra de conclusão de fase

Uma fase só está completa quando **todos os critérios de conclusão** listados no arquivo de status estiverem verificados. Não marque a fase como completa antes disso.

---

## 3. Arquitetura do projeto — regras para o server

Diretório: `passkeys-server/src/`

### Camadas (respeite a separação)

```
infra/api/index.ts        ← apenas rotas Fastify e middleware
registration/index.ts     ← apenas lógica WebAuthn de registro
authentication/index.ts   ← apenas lógica WebAuthn de autenticação
infra/database/           ← apenas acesso a dados (MongoDB, Redis)
setup/index.ts            ← apenas leitura de variáveis de ambiente
```

**Proibido**: importar `database.ts` diretamente em `api/index.ts`. Rotas chamam apenas módulos de `registration/` ou `authentication/`.

**Proibido**: colocar lógica de negócio em `infra/api/index.ts`. Rotas são thin controllers.

### TypeScript

- `strict: true` está ativo — não use `any` sem justificativa explícita em comentário
- Não use `console.log` — use `logger` de `infra/logger.ts`
- Variáveis de ambiente: sempre leia de `setup/index.ts`, nunca de `process.env` diretamente nos módulos

---

## 4. Arquitetura do projeto — regras para o app

Diretório: `passkeys-app/`

### Estrutura esperada ao final

```
app/
├── index.tsx             ← tela de login/registro (entrada pública)
├── (tabs)/
│   └── index.tsx         ← home autenticado
└── _layout.tsx           ← layout raiz (não modificar sem necessidade)

services/
└── api.ts                ← único arquivo de chamadas HTTP ao server

```

**Proibido**: fazer `fetch` diretamente em componentes de tela. Todas as chamadas HTTP passam por `services/api.ts`.

**Proibido**: importar `react-native-passkey` fora de `app/index.tsx`. A lógica de passkey fica concentrada na tela de entrada.

### Expo

- O projeto usa `expo-dev-client` — não use Expo Go para testar módulos nativos
- Após instalar qualquer dependência nativa: `npx expo prebuild --platform android --clean`
- Caminho de alias `@/` está configurado — use-o em vez de caminhos relativos

---

## 5. Regras de paralelismo entre agentes

Dentro de cada fase, algumas subtarefas são independentes e podem ser executadas em paralelo.
O arquivo de status de cada fase indica quais subtarefas têm dependência entre si.

**Regra geral**:
- Subtarefas com `depends_on: []` podem rodar em paralelo
- Subtarefas com `depends_on: [X.Y]` só começam depois que X.Y está `[x] completed`
- O agente orquestrador lê os status antes de disparar sub-agentes

---

## 6. Regras de teste

- Verifique o critério de conclusão da fase **com um comando real** antes de marcar como completa
- Os critérios de conclusão estão definidos em cada `tasks/fase-X-status.md`
- Se o critério de conclusão falhar, marque a subtarefa relevante como `[!] blocked`

---

## 7. O que NÃO fazer

- Não refatore código que não faz parte da tarefa atual
- Não adicione dependências que não estejam especificadas na RFC ou no arquivo de status
- Não modifique `CLAUDE.md` ou `AGENTS.md` durante a execução de uma fase
- Não delete arquivos sem listar o motivo no arquivo de status
- Não avance de fase sem que o critério de conclusão da fase anterior esteja verificado
