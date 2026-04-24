# Task Tracking

Arquivos de status para cada fase do plano definido em
`rfcs/draft/RFC-0001-passkeys-poc-completion.md`.

## Fases

| Arquivo | Fase | Descrição |
|---------|------|-----------|
| `fase-1-status.md` | Fase 1 | Infraestrutura e HTTPS no server ✓ |
| `fase-1b-testes-server.md` | Fase 1b | Testes unitários do server (Jest + ts-jest) ✓ |
| `fase-2-status.md` | Fase 2 | App Android (prebuild, passkeys, telas, testes de api.ts) |
| `fase-3-status.md` | Fase 3 | Integração, certificados no emulador, testes E2E |
| `fase-4-documentacao.md` | Fase 4 | Documentação consolidada (CLAUDE.md, READMEs, RFC → completed) |

## Legenda de status

```
[ ] pending      — ainda não iniciado
[~] in_progress  — em andamento
[x] completed    — concluído e verificado
[!] blocked      — bloqueado (veja seção Blockers do arquivo)
[-] skipped      — ignorado com justificativa
```

## Templates

- `_template-fase.md` — base para criar arquivos de nova fase
- `../rfcs/_template-rfc.md` — base para criar nova RFC

Para scaffoldar uma nova RFC completa: `/feature-dev cria harness para a RFC-XXXX`

## Convenções

- Cada agente atualiza o arquivo de status ao **iniciar** e ao **concluir** cada subtarefa
- Fases são sequenciais entre RFCs e dentro de cada RFC
- Dentro de uma fase, subtarefas sem dependência podem rodar em paralelo
- Ver `AGENTS.md` seção 0 para o processo completo
