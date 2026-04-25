# Feedback Forward — Acumulador Cross-RFC

> Cada fase concluída acrescenta uma entrada aqui. Este arquivo é lido na fase de
> Documentação de cada RFC e alimenta atualizações em `AGENTS.md`, `CLAUDE.md` e
> `_template-fase.md`.
>
> Agente: preencha a seção da sua fase antes de marcar `[x] completed`.

---

## RFC-0001 — Conclusão da POC de Passkeys — HTTPS Local + Android

### Fase 1 — Infraestrutura e HTTPS

**O que funcionou bem**
- Parallelism map explícito (1.1, 1.2, 1.5 em paralelo) funcionou sem conflitos
- Critério de conclusão com comando real (`curl -k`) foi objetivo e verificável

**O que atrapalhou / gerou retrabalho**
- Variáveis de ambiente no `.env-example` estavam desatualizadas (`REDIS_HOST`/`REDIS_PORT` → `REDIS_URL`; `MONGODB_DATABASE` → `DB_NAME` + `COLLECTION_NAME`). O agente teve que reconciliar na execução
- `RP_ORIGIN` no `.env-example` apontava para `http://localhost:3001` (sem HTTPS, porta errada). Spec da fase devia incluir validação de consistência com `setup/index.ts`
- `mkcert -install` requer sudo interativo — não é automatizável; devia estar marcado como `[ação manual]` na subtarefa

**Atualizações aplicadas ao harness**
| Arquivo | Mudança |
|---------|---------|
| `CLAUDE.md` | `.env-example` atualizado para refletir nomes reais das variáveis |
| `CLAUDE.md` | Nota sobre `mkcert -install` como ação manual com senha |

**Aplicado?** `[x]` Sim — fase 4 de documentação

---

### Fase 1b — Testes Unitários do Server

**O que funcionou bem**
- Paralelismo real entre 1b.2 e 1b.3 (registration e authentication) sem conflitos
- Convenção de mocks inline (sem `__mocks__` global) foi clara e reproduzível
- Cobertura final: 100% statements/funções, 84% branches — acima do threshold

**O que atrapalhou / gerou retrabalho**
- Flag do Jest v29 renomeada: a subtarefa usava `--testPathPattern` (singular); a versão instalada exige `--testPathPatterns` (plural). Custo: retrabalho no critério de verificação
- `console.error` no catch de `registration/index.ts` produz output de teste que parece erro mas é comportamento esperado — causa confusão ao ler o relatório de teste

**Atualizações sugeridas para o harness**
| Arquivo | Seção | Mudança sugerida |
|---------|-------|-----------------|
| `AGENTS.md` | Seção 6 (Testes) | Documentar que Jest v29+ usa `--testPathPatterns` (plural) |
| `_template-fase.md` | Notas de template | Lembrete: verificar flags da versão instalada antes de fixar comandos na spec |

**Aplicado?** `[x]` Sim — feedback-forward RFC-0002 (AGENTS.md seção 6; CLAUDE.md seção Testes)

---

### Fase 2 — App Android

**O que funcionou bem**
- Separar a cadeia nativa (2.1→2.2→2.3→2.4) do serviço (2.5→2.8) em dois sub-agentes paralelos funcionou bem
- `react-native-passkey` v3.3.3 compatível com Expo SDK 53 / RN 0.79 sem ajustes

**O que atrapalhou / gerou retrabalho**
- `ts-node` não estava listado como dependência de setup; foi descoberto ao executar `jest.config.ts` em TypeScript. Deveria estar na spec de 2.8
- Verificação final de `npx expo run:android` ficou marcada como "pendente" — requer emulador físico/emulado que o agente não pode operar autonomamente. Subtarefas com dependência de hardware devem ser marcadas como `[ação manual]`
- Blocker de Gradle (7.3.3 incompatível com Expo SDK 53) só apareceu na fase 3; a spec de 2.2 (`expo prebuild`) devia incluir verificação de `sdkVersion` no `app.json`
- Arquitetura de rotas (`app/index.tsx` vs `app/(tabs)/index.tsx`) não estava suficientemente especificada — gerou blocker de navegação resolvido na fase 3

**Atualizações sugeridas para o harness**
| Arquivo | Seção | Mudança sugerida |
|---------|-------|-----------------|
| `AGENTS.md` | Seção 4 (App) | Adicionar: verificar `sdkVersion` em `app.json` antes de `expo prebuild` |
| `CLAUDE.md` | Setup do app | Documentar que `ts-node` é devDependency necessária para `jest.config.ts` em TypeScript |
| `_template-fase.md` | Template | Marcar subtarefas com dependência de hardware como `[ação manual]` |

**Aplicado?** `[x]` Sim — feedback-forward RFC-0002 (AGENTS.md seção 4: sdkVersion + rota home.tsx; CLAUDE.md: ts-node; _template-fase.md: marcação [ação manual])

---

### Fase 3 — Integração e E2E

**O que funcionou bem**
- Parallelism map (3.1, 3.2, 3.3 simultâneos) reduziu latência da fase
- Seção "Troubleshooting comum" nas Notas foi adicionada organicamente — boa prática a institucionalizar

**O que atrapalhou / gerou retrabalho** ⚠️ (4 blockers nesta fase — sinal de gaps nas fases anteriores)
- Caminho do debug keystore na spec estava errado: spec dizia `~/.android/debug.keystore`; real é `passkeys-app/android/app/debug.keystore`
- `ANDROID_ORIGIN` (`android:apk-key-hash:...`) não estava no harness inicial; só foi descoberto ao executar o fluxo real. Deveria estar na spec da Fase 1 ou na lista de variáveis de `.env-example`
- Body vazio em `generate-authentication-options` — bug em `services/api.ts` que os testes unitários da fase 1b não cobriram (teste mockava o fetch, não validava o body enviado)
- Navegação de logout presa — arquitetura de rotas insuficientemente especificada na fase 2; corrigida movendo home para `app/home.tsx`

**Atualizações sugeridas para o harness**
| Arquivo | Seção | Mudança sugerida |
|---------|-------|-----------------|
| `CLAUDE.md` | Env vars | Documentar `ANDROID_ORIGIN` e como calcular o `apk-key-hash` |
| `CLAUDE.md` | Setup | Corrigir caminho do debug keystore para `passkeys-app/android/app/debug.keystore` |
| `AGENTS.md` | Seção 4 (App) | Adicionar regra: rota de home autenticado usa `app/home.tsx`, não `app/(tabs)/index.tsx` |
| `AGENTS.md` | Seção 6 (Testes) | Testes de `services/api.ts` devem validar body enviado no fetch, não apenas a resposta |

**Aplicado?** `[x]` Sim — feedback-forward RFC-0002 (AGENTS.md seção 4: rota home.tsx; seção 6: body validation)

---

### Fase 4 — Documentação

**O que funcionou bem**
- Estratégia "documente apenas o que não é óbvio" manteve o `CLAUDE.md` conciso
- Leitura das `## Notas` das fases anteriores foi suficiente para gerar o `CLAUDE.md`

**O que atrapalhou / gerou retrabalho**
- Vários insights das Notas das fases já estavam "esquecidos" no momento da documentação por ausência de um acumulador persistente — criação deste arquivo (`feedback-forward.md`) resolve isso

**Atualizações sugeridas para o harness**
| Arquivo | Seção | Mudança sugerida |
|---------|-------|-----------------|
| `_template-fase.md` | Nova seção | Adicionar `## Feedback Forward` como campo obrigatório antes de `[x] completed` |
| `AGENTS.md` | Nova seção | Regra: preencher `## Feedback Forward` e atualizar `tasks/feedback-forward.md` ao concluir fase |
| `tasks/README.md` | Referência | Mencionar `feedback-forward.md` como acumulador cross-RFC |

**Aplicado?** `[x]` Sim — este arquivo

---

## RFC-0002 — UX da POC de Passkeys Android

### Fase 1 — UX do App Android

**O que funcionou bem**
- Spec da fase referenciou diretamente as correções da RFC-0001 (home em `app/home.tsx`)
- Separação entre visual (1.1), keyboard (1.2), feedback (1.3) e home (1.4) foi clara

**O que atrapalhou / gerou retrabalho**
- `npm run lint` falhava por resolução do binário `eslint`; o script em `passkeys-app/package.json` foi ajustado para invocar `node ./node_modules/eslint/bin/eslint.js` (registado nas Notas da fase 1)

**Atualizações sugeridas para o harness**
| Arquivo | Mudança |
|---------|---------|
| `CLAUDE.md` / `passkeys-app/README.md` | Mencionar o script de lint do app (feito na fase 3) |

**Aplicado?** `[x]` Sim — fase 3 de documentação

---

### Fase 2 — Validação UX e E2E

**O que funcionou bem**
- Critério de automação (`npm test && npm run lint`) objetivo; teste HTTP 404 alinhado a `api.ts`
- Notas separaram evidência de código (keyboard, `accessibilityLabelledBy`, mapas de erro) de checklist manual

**O que atrapalhou / gerou retrabalho**
- Subtarefas 2.2–2.3 dependem de emulador; o harness já prevê validação manual — sem alteração de template necessária

**Atualizações sugeridas para o harness**
- Nenhuma de alta prioridade a partir desta fase

**Aplicado?** `[x]` N/A

---

### Fase 3 — Documentação

**O que funcionou bem**
- RFC-0002 em `rfcs/completed/` com Decision Record; `token-report.md` consolida métricas das três fases
- `CLAUDE.md` agora descreve `index.tsx` / `home.tsx` e liga tarefas RFC-0002; README do app orienta demo sem duplicar a RFC

**O que atrapalhou / gerou retrabalho**
- Ficheiro de fase 3 ainda listava fase 2 como bloqueada; reconciliação manual do estado real dos ficheiros de task antes de executar

**Atualizações sugeridas para o harness**
| Arquivo | Mudança |
|---------|---------|
| Nenhuma crítica | Orquestrador deve confirmar `fase-2` no disco como `[x]` antes de tratar fase 3 como bloqueada |

**Aplicado?** `[x]` Sim — AGENTS.md seção 2: regra de verificação no disco antes de declarar bloqueio

---

## Insights transversais (aplicam a todas as RFCs)

| Categoria | Insight | Prioridade |
|-----------|---------|-----------|
| **Spec** | Sempre cruzar nomes de env vars com `setup/index.ts` antes de escrever a fase | Alta |
| **Spec** | Verificar caminhos de arquivos gerados por tooling (keystores, certs) executando antes de fixar na spec | Alta |
| **Testes** | Testes de serviços HTTP devem validar o body/headers enviados, não apenas a resposta mockada | Média |
| **Infra** | Subtarefas com dependência de hardware ou interação manual → marcar `[ação manual]` + não bloquear o parallelism map | Média |
| **Tooling** | Fixar versões de flags de CLI na spec (ex: `--testPathPatterns` no Jest v29) | Baixa |
| **Arquitetura** | Definir estrutura de rotas do app (qual arquivo é home autenticado) na RFC, não na fase | Alta |
| **Blockers** | Fase com 3+ blockers resolvidos = spec da fase anterior tinha gaps; revisar template para exigir validação de pré-condições mais explícita | Alta |
