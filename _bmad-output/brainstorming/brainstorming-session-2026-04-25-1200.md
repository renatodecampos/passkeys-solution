---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'RFC-0004 — aprofundar exploração, expor lacunas e fortalecer o PoC (binding Keystore Android + auditoria por tentativa de autenticação)'
session_goals: 'Mapear o que está subespecificado, riscos de conclusão falsa e ações concretas na RFC/harness; ideiação multi-lens ancorada no draft da RFC e em tasks/rfc-0004/*'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Reverse Brainstorming', 'Six Thinking Hats']
current_technique: ''
session_brainstorming_status: completed
ideas_generated: []
context_file: 'rfcs/draft/RFC-0004-android-keystore-auth-audit-biometry-signal.md'
language: pt-BR
session_continued: true
continuation_date: '2026-04-25T12:00:00-03:00'
---

# Resultados da sessão de brainstorming

**Facilitador:** Renato (fluxo BMad brainstorming)  
**Idioma da sessão:** português (Brasil)  
**Data:** 2026-04-25  
**Arquivo da sessão:** `brainstorming-session-2026-04-25-1200.md`

## Visão geral da sessão

**Tópico:** RFC-0004 (PoC só Android) — binding de Keystore gerenciado pelo app com `setInvalidatedByBiometricEnrollment`, log por tentativa em `auth_attempts` e `binding_outcome` no servidor — explorar **lacunas**, **ambiguidade** e **higiene de pesquisa** (fora de escopo: OTP/Liveness).

**Metas:** Produzir lacunas acionáveis (técnico, UX, dados, modelo de ameaça, metodologia) para incorporar em Open Questions, Technical design ou fases; manter eixos **ortogonais** para reduzir viés sequencial.

### Orientação de contexto

- **Documento principal:** `rfcs/draft/RFC-0004-android-keystore-auth-audit-biometry-signal.md` (harness: `tasks/rfc-0004/fase-1-server-audit-binding.md`, `fase-2-android-keystore.md`, `fase-3-documentacao.md`).
- **H1 / H2:** verificação de binding após mudança de matrícula; trilha de auditoria suficiente para revisão offline sem segundo fator.
- **Política padrão:** não bloquear WebAuthn em `binding_lost` salvo se `AUTH_DENY_ON_BINDING_LOST=true`.

### Configuração da sessão

- **Continuidade:** sessão nova (não havia arquivos anteriores em `/_bmad-output/brainstorming/`).
- **Contexto vindo do chat anterior:** lista inicial multi-lens de lacunas (plataforma/OEM, ordem de falhas, PII, abuso de `auth_attempts`, falseabilidade de H1, emulador vs aparelho, etc.) — a **estender** na execução (passo 3), não só reorganizar.
- **Próximo insumo:** ver mensagem do facilitador no chat (trajetória de técnicas 1–4).

### Banco de ideias (semente — exploração pré-sessão)

_São pontos de partida; a sessão acrescenta com as técnicas escolhidas._

1. **Plataforma:** matriz API/OEM para invalidação no Keystore ainda não fixada na RFC.
2. **Ordem:** `auth_attempt` quando WebAuthn falha antes do binding — subespecificado.
3. **UX falso-positivo:** “segunda digital” vs atacante — sem fluxo de re-bind no escopo.
4. **Metodologia:** H1 não observado em alguns builds → documentar como resultado negativo, não como “falha do experimento”.
5. **Operação/abuso:** inserções ilimitadas em `auth_attempts` sob brute force.
6. **Dois desafios:** WebAuthn vs binding — risco de misturar/replay na implementação.
7. **Reinstalar** / limpar dados — `keystore_binding` antigo vs chave nova.
8. **Emulador** vs StrongBox no hardware — ressalva de validade externa no Decision Record.

---

## Log append-only (facilitação)

_Instruções, execução de técnicas e novas ideias serão acrescentadas abaixo._

---

## Seleção de técnicas (passo 2b — IA recomendada) — **confirmada**

**Abordagem:** opção **2** — técnicas recomendadas pela IA (`brain-methods.csv`).

**Contexto da análise**

- **Tópico:** RFC-0004 — binding Keystore + auditoria; buscar **lacunas** e **fortalecer** o PoC.
- **Metas:** áreas subespecificadas, riscos de conclusão falsa, follow-ups concretos na RFC/harness.
- **Restrições:** só Android; sem OTP/Liveness; binding aditivo; auditoria no DB; PoC de pesquisa, não motor de risco de produção.
- **Tipo de sessão:** especificação técnica / ameaça e metodologia (em parte abstrata).

**Sequência recomendada (sob medida)**

| Fase | Técnica | Categoria | Est. | Por que encaixa |
|------|---------|-----------|------|-----------------|
| 1 | **Question Storming** | deep | ~20 min | Achar lacunas na RFC = “o que a spec precisa responder?”; perguntas antes de respostas evitam suposições erradas (ordem do desafio, falseabilidade de H1, retenção). |
| 2 | **Reverse Brainstorming** | creative | ~20 min | Expõe como o PoC pode **enganar** (falsa confiança, variância OEM, `binding_lost` = “atacante” vs “usuário adicionou dedo”) — alinhado a lacunas e transparência de risco. |
| 3 | **Six Thinking Hats** | structured | ~25 min | Fechamento com **varredura**: fatos (texto da RFC), riscos (chapéu preto), benefícios (amarelo), processo (azul) → checklist acionável. |

**Total ~65 min** de ideação facilitada (pode ser fatiada); o **passo 3** roda uma técnica por vez, no teu ritmo.

**Racional da IA:** resolver problema + clarear spec → **Question Storming**; modos de falha e “o que dá errado nas conclusões” → **Reverse Brainstorming**; fechamento equilibrado → **Six Thinking Hats**.

**Status:** **[x] Confirmada** (usuário: **C** Continuar) — 2026-04-25. Em **execução do passo 3**.

---

## Fase 1 — Question Storming (em andamento)

**Regra:** Só **perguntas** — nenhuma resposta neste bloco (respostas ficam na RFC ou depois).

### Perguntas capturadas (append-only)

_Semente do facilitador + tuas adições:_

- O que está, exatamente, no **caminho crítico** para a H1 ser *falseada* num dado aparelho (nível de API, OEM, StrongBox) e em que ponto deixamos de chamar isso de “sinal” do Keystore e passamos a chamar de quirk de implementação?
- Se a **verificação WebAuthn falhar primeiro**, ainda se grava `auth_attempt`? Com qual `binding_outcome` — sempre `skipped`, ou o binding ainda é avaliado?
- Como **acoplamos** o desafio de binding ao desafio WebAuthn no tempo e no Redis (mesmo id de sessão? ordem de consumo) para que um bug não misture nem faça replay?
- Que **verdade de campo** (se houver) temos de que “a matrícula mudou” além da *inferência* a partir de `binding_lost`?
- Qual a **retenção** e a **finalidade** de cada campo em `auth_attempts` num PoC de pesquisa (LGPD / política interna), mesmo num MongoDB no laptop?
- Quando o usuário **de boa-fé** adiciona uma segunda digital, que **narrativa** (para stakeholders) a RFC precisa no texto para não ser mal interpretada no PoC (ainda que não haja recuperação em produto)?
- Que **versão** de esquema de documento (`schemaVersion` nos registos) usamos para que exportações sejam comparáveis entre iterações?
- Se o **GPM / passkey** for restaurado num aparelho novo mas o **binding do nosso app** for novo, o que o servidor faz com linhas **antigas** de `keystore_binding`?

**Contribuições do Renato (2026-04-25):**

1. Quais são os **riscos** envolvidos? (âmbito geral do desenho PoC + binding + auditoria.)
2. Se o usuário utilizar o **PIN do celular** ao invés da biometria, como vamos **monitorar**? (o que o sinal do Keystore/BiometricPrompt cobre ou deixa de cobrir.)
3. Deveríamos **permitir somente biometria** e não permitir um **fallback** (PIN/padrão como desbloqueio do autenticador)?

_…continua na sessão (chat + abaixo)._

**Retomada 2026-04-25 (facilitador) — pivôs ortogonais (operação, custo, metodologia, produto, edge):**

- Qual o **SLO** aceitável para “binding verificado após desafio” no PoC (p95) e o que acontece no relatório se o Redis estiver lento?
- O PoC precisa de **cota** ou *kill switch* para `auth_attempts` por IP/device/user para não virar DDoS de log?
- **Quem paga** o custo de armazenamento e query desses eventos se o lab virar “sempre ligado” por semanas?
- **Definição de pronto** do experimento: o que é “H1 observado” vs “H1 não observado com equipamento Y” de forma replicável por outro dev?
- Se **Doze** (app idle) atrasar jobs que tocam o Keystore, o fluxo ainda é válido para a conclusão da RFC ou entramos em exceção “nível de SO”?
- A RFC precisa dizer o que fazer com **root / SafetyNet incompatível** — ignorar, marcar, ou excluir do dataset?
- **Comparação** entre builds (debug vs release) invalida o mesmo *run* de PoC; isso está explícito como risco de confounding?
- Stakeholder de **privacidade**: o texto “apenas metadado” aguenta se `auth_id` e timestamps correlacionam pessoas em bases pequenas?
- E se o utilizador tiver **dois perfis** (work profile) no aparelho — o binding e o WebAuthn estão claramente no mesmo *security boundary* no desenho?
- **Export** dos dados (CSV, JSON) inclui *hash* de versão de app/ABI para *post hoc* análise de bugs?

_…continua na sessão (chat + abaixo)._

**Fase 1 encerrada para avanço:** 2026-04-25 — transição para **Fase 2 — Reverse Brainstorming** (pedido do Renato: “bora pra fase 2”).

---

## Fase 2 — Reverse Brainstorming (em andamento)

**Regra:** gerar **problemas, falhas e conclusões enganosas** — não soluções. Pergunta-mãe: *“Como este PoC pode nos **enganar** ou dar **falsa confiança**?”*

### Ideias capturadas (append-only)

_Semente do facilitador + tuas adições:_

- **[Risco / metodologia]** Concluir que “`binding_lost` = invasão” quando na verdade foi o usuário que adicionou uma digital legítima — **falso alarme** para produto e para paper.
- **[OEM / plataforma]** Num build, o Keystore **não invalida** ao adicionar biometria — H1 **não se observa** e o time interpreta como “feature pronta” em vez de **resultado negativo documentado**.
- **[Emulador]** Resultado só no emulador sem StrongBox — **generalizar** para aparelhos reais sem ressalva no Decision Record.
- **[Ordem / telemetria]** `auth_attempts` lotado de noise (bots, testes) — analista conclui **padrão de ataque** onde só há ruído de integração.
- **[Dois desafios]** Bug que assina o challenge errado ou reutiliza challenge — binding “ok” com **lógica fraca** e cientificamente inútil.
- **[PIN vs biometria]** O RFC promete “sinal de biometria alterada” mas o fluxo aceita **PIN** no desbloqueio do Keystore — stakeholders leem **mais** do que o sistema prova.
- **[Política]** Ativar `AUTH_DENY_ON_BINDING_LOST=true` em demo e achar que isso é **estratégia de produto** validada (só é flag de laboratório).
- **[Dados]** Exportar CSV de `auth_attempts` com **PII** sem governança — “prova” vira passivo **compliance**.

_…continua (chat + abaixo)._

**Fase 2 encerrada:** 2026-04-25 — Renato sem mais itens; semente + lista acima fica registo. **Fase 3 aberta** — Six Thinking Hats.

---

## Fase 3 — Six Thinking Hats (concluída no documento — rascunho facilitado)

**Regra:** passar pelos seis “chapéus” (fatos, emoção, riscos, benefícios, criatividade, processo) sem misturar papéis no mesmo parágrafo.

| Chapéu | Pergunta para a RFC-0004 | Síntese (rascunho a partir desta sessão) |
|--------|--------------------------|----------------------------------------|
| **Branco** (fatos) | O que o draft já diz, sem juízo? | PoC Android-only; `auth_attempts` + `keystore_binding`; binding com Keystore + `setInvalidatedByBiometricEnrollment`; desafio de servidor; `AUTH_DENY_ON_BINDING_LOST` default off; H1/H2 explícitas; sem OTP/Liveness. |
| **Vermelho** (intuição) | O que inquieta, sem provar? | Risco de “vender” o sinal como prova de ataque; PIN vs biometria vago; emoção de que DB cheio = seguro. |
| **Preto** (riscos) | O que pode dar errado? | Falso positivo (dedo legítimo); OEM não invalida; emulador ≠ hardware; abuso de `auth_attempts`; bug nos dois desafios; PII no export. |
| **Amarelo** (benefícios) | O que, se der certo, é valioso? | Auditoria por tentativa; sinal *adicional* além do WebAuthn; falseabilidade de H1; base de dados para paper e próxima iteração. |
| **Verde** (criatividade) | O que testar depois, sem fechar? | Matriz API/OEM; ressalva explícita no Decision Record; `schemaVersion`; linha de “PIN = outro sinal/flag”; limite de taxa no insert. |
| **Azul** (processo) | Próximo passo, ordem? | 1) Colar no draft: Open Questions (PIN, fallback, retenção). 2) “Limitações do PoC” (1 parágrafo). 3) Executar fases `tasks/rfc-0004` 1 → 2 → 3. |

**Resumo de uma frase (chapéu azul):** a RFC-0004 fica **forte** se separar com clareza **o que o servidor prova** (WebAuthn + assinatura do binding) **do que o produto ainda não promete** (detecção de atacante, biometria pura, produção).

---

**Sessão (step 3) — técnicas executadas:** Question Storming → Reverse Brainstorming → Six Thinking Hats.  
Podes marcar o brainstorming deste ficheiro como **“revisado / incorporar na RFC”** quando colares tabela ou seção **Limitações + Open Questions** no `rfcs/draft/RFC-0004-...md`.

---

## Comunicação BMad (projeto)

`/_bmad/core/config.yaml` foi ajustado para:
- `communication_language: Portuguese (Brazil)`
- `document_output_language: Portuguese (Brazil)`

Próximas mensagens do facilitador neste fluxo BMad: **pt-BR**.
