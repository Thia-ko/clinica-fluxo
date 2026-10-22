# ClinicaFluxo

Sistema de gestão do fluxo de pacientes de uma clínica: da senha no totem até o fim do atendimento, medindo onde o paciente espera mais.

> Projeto de estudo e portfólio. Usa **apenas dados fictícios**. Não use com dados reais de pacientes (LGPD).

## O que já funciona

- **Totem** (`/totem`): o paciente tira a senha normal (`N001`) ou prioritária (`P001`).
- **Fila** (`/fila`): recepção, triagem e consultório avançam cada senha de etapa. Prioritárias aparecem primeiro e cada senha mostra há quantos minutos está na etapa.
- **Painel de chamada** (`/painel`): tela para a TV com a senha chamada e a sala, atualizando sozinha.
- **Login e cargos**: Admin, Recepção, Enfermagem, Médico e Gestor. Cada cargo só executa as ações da sua etapa (a Recepção faz check-in, a Enfermagem chama a triagem, o Médico chama o consultório). O Admin cria usuários e define cargos em `/admin/usuarios`.
- Cada mudança de etapa grava um horário (`TicketEvent`), base para calcular tempos de espera.

Fluxo da senha:

```
Aguardando recepção → Aguardando triagem → Em triagem → Aguardando consulta → Em consulta → Finalizado
```

## Roadmap

- [x] Fase 1–4: projeto, senhas, etapas com horário e painel de chamada
- [x] Fase 5: login e cargos (Admin, Recepção, Enfermagem, Médico, Gestor)
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
npm run seed   # cria usuários FICTÍCIOS de demonstração (veja prisma/seed.ts)
npm run dev
```

Abra <http://localhost:3000>. Os e-mails de demonstração e a senha estão em `prisma/seed.ts` (use apenas em desenvolvimento). Dica: deixe `/painel` aberto em uma aba e use `/fila` em outra para ver a chamada acontecendo.

## Segurança (o que já está feito)

- Senhas guardadas só como hash `scrypt` com salt; nunca em texto.
- Sessão em cookie `HttpOnly` + `SameSite=Lax`; o banco guarda só o hash do token e a sessão expira em 8 h.
- Cada ação do servidor confere login e cargo, sem confiar no que a tela mostra.
- Freio de 5 tentativas erradas por e-mail a cada 15 min e mensagem de erro genérica no login.
- Usuário desativado perde as sessões abertas na hora.

## Estrutura

```
prisma/schema.prisma   modelo de dados (Ticket, TicketEvent, User, Session)
src/lib/flow.ts        regras do fluxo: etapas, transições e salas
src/app/actions.ts     ações do servidor (criar senha, avançar etapa)
src/app/totem          tela do totem
src/app/(staff)/fila   tela da fila de atendimento (exige login)
src/app/(staff)/admin  gestão de usuários e cargos (só Admin)
src/app/login          tela de login
src/lib/auth.ts        exige login/cargo em páginas e ações
src/lib/session.ts     sessões em cookie HttpOnly + banco
src/lib/password.ts    hash de senha (scrypt)
src/app/painel         painel de chamada (TV)
src/app/api/painel     dados do painel em JSON
```
