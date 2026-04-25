# Task tracking

Cada **RFC** tem uma pasta `tasks/rfc-<número>/` com os arquivos de status daquela iniciativa. Os
números de fase (1, 2, 3, …) **recomeçam em cada RFC**.

Templates compartilhados (raiz de `tasks/`):

- `tasks/_template-fase.md` — base para criar novas fases

## RFC-0001 — `tasks/rfc-0001/`

| Arquivo | Fase | Descrição |
|---------|------|-----------|
| `fase-1-status.md` | 1 | Infraestrutura e HTTPS no server |
| `fase-1b-testes-server.md` | 1b | Testes unitários do server (Jest + ts-jest) |
| `fase-2-status.md` | 2 | App Android (prebuild, passkeys, telas, testes de api.ts) |
| `fase-3-status.md` | 3 | Integração, certificados no emulador, testes E2E |
| `fase-4-documentacao.md` | 4 | Documentação consolidada (CLAUDE.md, READMEs, RFC → completed) |
| `token-report.md` | — | Consolidação de tokens (RFC-0001) |

## RFC-0002 — `tasks/rfc-0002/`

| Arquivo | Fase | Descrição |
|---------|------|-----------|
| `fase-1-ux-app.md` | 1 | UX do app Android |
| `fase-2-ux-validacao.md` | 2 | Validação UX e E2E |
| `fase-3-documentacao.md` | 3 | Documentação (RFC-0002 → completed) |
| `token-report.md` | — | Consolidação de tokens (RFC-0002), criado na fase 3 |

## Legenda de status

```
[ ] pending      — ainda não iniciado
[~] in_progress  — em andamento
[x] completed    — concluído e verificado
[!] blocked      — bloqueado (veja seção Blockers do arquivo)
[-] skipped      — ignorado com justificativa
```

## Referência rápida

- Criar harness para uma nova RFC: `AGENTS.md` seção 0
- `../rfcs/_template-rfc.md` — base para novas RFCs
- `../AGENTS.md` — comandos `/feature-dev` e regras para agentes
- `tasks/feedback-forward.md` — acumulador cross-RFC de insights de cada fase concluída

Para scaffoldar uma nova RFC completa: `/feature-dev cria harness para a RFC-XXXX`

## Convenções

- Cada agente atualiza o arquivo de status ao **iniciar** e ao **concluir** cada subtarefa
- Fases são sequenciais **dentro** de uma RFC; entre RFCs, siga a cadência e pré-requisitos de cada fase
- Dentro de uma fase, subtarefas sem dependência podem rodar em paralelo
- Ver `AGENTS.md` seção 0 para o processo completo
