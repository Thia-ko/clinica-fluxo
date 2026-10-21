# ClinicaFluxo

Sistema de gestão do fluxo de pacientes de uma clínica: da senha no totem até o fim do atendimento, medindo onde o paciente espera mais.

> Projeto de estudo e portfólio. Usa **apenas dados fictícios**. Não use com dados reais de pacientes (LGPD).

## O que já funciona

- **Totem** (`/totem`): o paciente tira a senha normal (`N001`) ou prioritária (`P001`).
- **Fila** (`/fila`): recepção, triagem e consultório avançam cada senha de etapa. Prioritárias aparecem primeiro e cada senha mostra há quantos minutos está na etapa.
- **Painel de chamada** (`/painel`): tela para a TV com a senha chamada e a sala, atualizando sozinha.
- Cada mudança de etapa grava um horário (`TicketEvent`), base para calcular tempos de espera.

Fluxo da senha:

```
Aguardando recepção → Aguardando triagem → Em triagem → Aguardando consulta → Em consulta → Finalizado
```

## Roadmap

- [x] Fase 1–4: projeto, senhas, etapas com horário e painel de chamada
- [ ] Fase 5: login e cargos (Admin, Recepção, Enfermagem, Médico, Gestor)
- [ ] Fase 6: painel de gestão (tempo médio por etapa, alertas de atraso)
- [ ] Fase 7: pesquisa de satisfação do paciente
- [ ] Fase 8: deploy e troca de SQLite por PostgreSQL

## Tecnologias

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · SQLite

## Como rodar

Requisitos: Node.js 20+.

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Abra <http://localhost:3000>. Dica: deixe `/painel` aberto em uma aba e use `/fila` em outra para ver a chamada acontecendo.

## Estrutura

```
prisma/schema.prisma   modelo de dados (Ticket, TicketEvent)
src/lib/flow.ts        regras do fluxo: etapas, transições e salas
src/app/actions.ts     ações do servidor (criar senha, avançar etapa)
src/app/totem          tela do totem
src/app/fila           tela da fila de atendimento
src/app/painel         painel de chamada (TV)
src/app/api/painel     dados do painel em JSON
```
