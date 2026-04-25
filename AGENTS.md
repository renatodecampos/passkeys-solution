# AGENTS.md

Convenções para agentes (Claude Code, Cursor, ou qualquer LLM) trabalhando neste repositório.
Estas regras têm precedência sobre comportamentos padrão dos agentes.

---

## 0. Como usar este harness

### Executar uma fase existente

Abra uma nova janela de contexto e use:

```
/feature-dev execute RFC-XXXX fase <identificador>
```

- `RFC-XXXX` é a iniciativa (ex: `RFC-0001`, `RFC-0002`)
- A pasta de tasks é `tasks/rfc-xxxx/` (número da RFC em **minúsculas**)
- `fase` usa o identificador do plano: `1`, `1b`, `2`, `3` … (cada RFC recomeça em 1)

O agente abre o arquivo `tasks/rfc-xxxx/fase-....md` correspondente, lê a seção **"Instruções para o
Orquestrador"** e executa. Cada arquivo é autossuficiente.

| Comando | Arquivo lido |
|---------|-------------|
| `/feature-dev execute RFC-0001 fase 1` | `tasks/rfc-0001/fase-1-status.md` |
| `/feature-dev execute RFC-0001 fase 1b` | `tasks/rfc-0001/fase-1b-testes-server.md` |
| `/feature-dev execute RFC-0001 fase 2` | `tasks/rfc-0001/fase-2-status.md` |
| `/feature-dev execute RFC-0001 fase 3` | `tasks/rfc-0001/fase-3-status.md` |
| `/feature-dev execute RFC-0001 fase 4` | `tasks/rfc-0001/fase-4-documentacao.md` |
| `/feature-dev execute RFC-0002 fase 1` | `tasks/rfc-0002/fase-1-ux-app.md` |
| `/feature-dev execute RFC-0002 fase 2` | `tasks/rfc-0002/fase-2-ux-validacao.md` |
| `/feature-dev execute RFC-0002 fase 3` | `tasks/rfc-0002/fase-3-documentacao.md` |

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

2. **Criar a pasta** `tasks/rfc-<NÚMERO-EM-MINÚSCULO>/` (ex: `tasks/rfc-0003/`)

3. **Criar os arquivos de fase** nessa pasta
   - Um arquivo por fase definida na RFC
   - Usar `tasks/_template-fase.md` como base para cada um
   - Nomenclatura: `fase-<número>-<slug>.md` (fases numéricas recomeçam em **1** para cada RFC)
   - Preencher subtarefas, parallelism map e instruções do orquestrador
   - Referências cruzadas e pré-condições usam caminhos `tasks/rfc-XXXX/...`

4. **Atualizar `tasks/README.md`**
   - Adicionar seção com tabela da nova RFC e caminhos dos arquivos

5. **Atualizar a tabela de comandos** na seção 0 deste arquivo (`AGENTS.md`)
   - Adicionar linhas `/feature-dev execute RFC-XXXX fase Y → tasks/rfc-xxxx/fase-....md`

**O que NÃO fazer ao criar harness:**
- Não modifique fases de outras RFCs sem coordenação
- Não altere `CLAUDE.md` (exceto na fase de documentação, quando a RFC assim definir)
- Não mova ou renomeie pastas `tasks/rfc-xxxx/` concluídas sem atualizar **todas** as referências (AGENTS, README, fases, RFCs)

---

## 1. Leitura obrigatória antes de qualquer tarefa

Antes de escrever qualquer linha de código, leia:

1. `CLAUDE.md` — visão geral do projeto, comandos e arquitetura
2. O arquivo de status da fase em que você está trabalhando (`tasks/rfc-XXXX/...md`)
3. A RFC do plano em `rfcs/draft/` ou `rfcs/completed/` (conforme a iniciativa ativa)

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

### Verificação de pré-condição no disco

Antes de declarar uma fase bloqueada por pré-condição, **leia o arquivo de fase anterior no disco** e confirme o status real. O arquivo pode estar `[x] completed` mesmo que o orquestrador não tenha recebido a confirmação explícita (lição RFC-0002 fase 3).

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
├── index.tsx             ← tela de login/registro (entrada pública — Calm Card)
├── home.tsx              ← tela autenticada (Home Proof); NÃO use app/(tabs)/index.tsx
├── (tabs)/
│   └── index.tsx         ← tabs genéricas (explore etc.); fora do fluxo passkey
└── _layout.tsx           ← layout raiz (não modificar sem necessidade)

services/
└── api.ts                ← único arquivo de chamadas HTTP ao server

```

**Proibido**: fazer `fetch` diretamente em componentes de tela. Todas as chamadas HTTP passam por `services/api.ts`.

**Proibido**: importar `react-native-passkey` fora de `app/index.tsx`. A lógica de passkey fica concentrada na tela de entrada.

**Proibido**: usar `app/(tabs)/index.tsx` como destino de navegação pós-login. O fluxo de passkey usa `app/index.tsx` → `app/home.tsx`. Misturar com a navegação por tabs gera ambiguidade de rota e blocker de logout (lição RFC-0001 fase 3).

### Expo

- O projeto usa `expo-dev-client` — não use Expo Go para testar módulos nativos
- Antes de rodar `expo prebuild`, confirme que `sdkVersion` em `app.json` está alinhado com a versão do Expo SDK instalada (ex: `"53.0.0"` para SDK 53). Divergência causa falha de Gradle.
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
- Os critérios de conclusão estão definidos em cada `tasks/rfc-XXXX/fase-....md` da RFC em execução
- Se o critério de conclusão falhar, marque a subtarefa relevante como `[!] blocked`

### Jest — flags e versão

- Jest v29+ renomeou `--testPathPattern` (singular) para `--testPathPatterns` (plural). Sempre use a forma plural ao fixar comandos na spec de uma fase.
- Para verificar a versão instalada: `npx jest --version`

### Testes de serviços HTTP (`services/api.ts`)

- Testes de funções que fazem `fetch` devem validar **o que é enviado** (body, headers) — não apenas mockar a resposta. Mockar só a resposta deixa bugs de body vazio ou header faltando invisíveis até a integração (lição RFC-0001 fase 3).
- Use `expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ body: ... }))` ou equivalente.

---

## 7. O que NÃO fazer

- Não refatore código que não faz parte da tarefa atual
- Não adicione dependências que não estejam especificadas na RFC ou no arquivo de status
- Não modifique `CLAUDE.md` ou `AGENTS.md` durante a execução de uma fase
- Não delete arquivos sem listar o motivo no arquivo de status
- Não avance de fase sem que o critério de conclusão da fase anterior esteja verificado

---

## 8. Feedback Forward — loop de melhoria contínua do harness

### O que é

Ao concluir cada fase, o agente orquestrador **deve** avaliar o que aprendeu durante a execução e registrar isso em dois lugares:

1. Na seção `## Feedback Forward` do arquivo de fase concluída
2. Em `tasks/feedback-forward.md` (acumulador cross-RFC)

Esses registros alimentam a fase de Documentação de cada RFC, que aplica as melhorias nos arquivos permanentes do harness (`AGENTS.md`, `CLAUDE.md`, `_template-fase.md`).

### Quando preencher

Imediatamente antes de atualizar `Status da fase` para `[x] completed`. Não é opcional.

### O que capturar

| Categoria | Exemplos |
|-----------|---------|
| **Spec incorreta** | Caminho de arquivo errado, nome de variável desatualizado, flag de CLI que mudou de versão |
| **Gap de pré-condição** | Dependência de hardware não marcada, pré-requisito de ambiente não documentado |
| **Gap de teste** | Comportamento não coberto pelos testes unitários que apareceu na integração |
| **Decisão de arquitetura** | Estrutura de rota, local de lógica, separação de responsabilidades que não estava na spec |
| **Retrabalho evitável** | Qualquer coisa que, se estivesse na spec, teria poupado tempo |

### Sinal de alerta

Uma fase com **3 ou mais blockers resolvidos** indica que a spec das fases anteriores tinha gaps significativos. Nesse caso, o agente deve:
1. Preencher `## Feedback Forward` com foco nos gaps da spec anterior
2. Adicionar em `tasks/feedback-forward.md` uma entrada em "Insights transversais" se o padrão for recorrente
3. Sugerir atualização explícita de `_template-fase.md` para evitar o mesmo gap em futuras RFCs

### Processo de aplicação (fase de Documentação)

O agente da fase de Documentação de cada RFC deve:
1. Ler `tasks/feedback-forward.md` inteiro
2. Aplicar todas as linhas com `Aplicado? [ ]` que forem de alta prioridade
3. Marcar as linhas aplicadas como `[x]` com referência ao commit ou PR
4. Atualizar `tasks/README.md` se novos arquivos de harness forem criados

---
