# ClinicaFluxo

Sistema de gestão do fluxo de pacientes de uma clínica: da senha no totem até o fim do atendimento, medindo onde o paciente espera mais.

> Projeto de estudo e portfólio. Usa **apenas dados fictícios**. Não use com dados reais de pacientes (LGPD).

## Telas e rotas

Cada tela tem a sua rota; não existe menu inicial.

| Rota      | Quem usa                                                 |
| --------- | -------------------------------------------------------- |
| `/totem`  | Paciente, no tablet/totem da entrada                     |
| `/painel` | TV da sala de espera                                     |
| `/login`  | Equipe (depois do login, cada cargo vai para a sua tela) |

## O que já funciona

- **Totem** (`/totem`): feito para toque. O paciente tira a senha normal (`N001`) ou prioritária (`P001`), vê quantas pessoas estão na frente, pode imprimir a senha e a tela volta sozinha ao início.
- **Fila** (`/fila`): cada cargo vê primeiro a sua etapa (com botão para ver todas). Prioritárias vêm primeiro, a próxima da fila é marcada e senhas acima do limite de espera ficam em destaque (ícone, tempo e limite). A equipe pode **chamar novamente** (o painel da TV anuncia de novo) e marcar **não compareceu**; a Recepção pode **reinserir** quem chegar depois no fim da fila.
- **Painel de chamada** (`/painel`): tela para a TV com a senha chamada, a sala, relógio e histórico das últimas chamadas. Avisa com som e voz em português (toque uma vez em "Ativar som e voz", exigência dos navegadores).
- **Login e conta**: tela de login com mostrar/ocultar senha, aviso de Caps Lock e "manter conectado por 7 dias" (opcional). Cargos: Admin, Recepção, Enfermagem, Médico e Gestor; cada um só executa as ações da sua etapa. O Admin cria usuários em `/admin/usuarios`: o sistema gera uma **senha provisória** (mostrada uma única vez) e a pessoa é obrigada a trocá-la no primeiro acesso. O Admin também **redefine a senha** de quem esqueceu. Em `/conta` cada pessoa troca a própria senha (com indicador de força) e vê **onde está conectada**, podendo sair dos outros aparelhos.
- **Painel de gestão** (`/gestao`, Gestor e Admin): espera média por paciente, tempo médio por etapa contra o limite, alertas de senhas atrasadas agora e horários de pico, com filtro por período e versão em tabela dos gráficos.
- **Pesquisa de satisfação** (`/avaliar/[token]`, pública): o QR code impresso na senha abre uma pesquisa de 1 minuto no celular, liberada só depois do atendimento e respondida uma única vez por senha. O paciente dá nota de 1 a 5, marca o que mais incomodou e pode comentar, sem informar dado pessoal. O Gestor vê nota média, taxa de resposta, distribuição das notas, ranking de motivos e comentários em `/gestao`.
- Cada mudança de etapa grava um horário (`TicketEvent`), base para calcular tempos de espera.

Fluxo da senha:

```
Aguardando recepção → Aguardando triagem → Em triagem → Aguardando consulta → Em consulta → Finalizado
```

## Roadmap

- [x] Fase 1–4: projeto, senhas, etapas com horário e painel de chamada
- [x] Fase 5: login e cargos (Admin, Recepção, Enfermagem, Médico, Gestor)
- [x] Fase 6: painel de gestão (tempo médio por etapa, alertas de atraso, horários de pico)
- [x] Fase 7: cada tela na sua rota, com foco no painel de chamada e no totem (sem menu inicial: `/totem` no tablet, `/painel` na TV, equipe entra por `/login`)
- [x] Fase 8: fila de atendimento (visão por cargo, destaque de atrasos, chamar novamente, não compareceu)
- [x] Fase 9: pesquisa de satisfação do paciente (QR code na senha, nota, motivos e comentário; resultados no painel de gestão)
- [x] Fase 10 (código): PostgreSQL com migrações, aparelhos protegidos por chave, fuso de Brasília, freio de login no banco, cabeçalhos de segurança e build de produção verificado
- [x] Melhoria: área de login e conta (troca e redefinição de senha, senha provisória, sessões ativas, bloqueio por e-mail e por origem)
- [ ] Fase 10 (publicação): criar as contas no Neon e na Vercel e publicar, seguindo o [guia de publicação](docs/DEPLOY.md)

## Tecnologias

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · Vitest · Docker (só para o banco local)

## Como rodar

Requisitos: Node.js 20+ e Docker (para o PostgreSQL local).

```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
npm run db:up            # sobe o PostgreSQL no Docker (porta 5433)
npm run db:migrate       # cria as tabelas
npm run seed             # usuários FICTÍCIOS de demonstração (veja prisma/seed.ts)
npm run seed:demo        # opcional: ~600 senhas FICTÍCIAS para o painel de gestão (apaga as senhas atuais)
npm run dev
```

Testes das contas de tempo, datas e pesquisa: `npm test`. Para publicar na internet, veja [docs/DEPLOY.md](docs/DEPLOY.md).

Em desenvolvimento, `/totem` e `/painel` abrem sem chave. Para testar o bloqueio de aparelhos, defina `DEVICE_KEY` no `.env` (veja `.env.example`) e autorize o navegador em `/aparelho`.

O QR code da senha usa o endereço em que o totem foi aberto. Para testar a pesquisa no celular, abra o totem pelo IP do computador na rede (o `npm run dev` mostra, ex.: `http://192.168.1.14:3000/totem`).

Abra <http://localhost:3000>. Os e-mails de demonstração e a senha estão em `prisma/seed.ts` (use apenas em desenvolvimento). Dica: deixe `/painel` aberto em uma aba e use `/fila` em outra para ver a chamada acontecendo.

## Segurança (o que já está feito)

- Senhas guardadas só como hash `scrypt` com salt; nunca em texto. Política: mínimo de 10 caracteres, bloqueio de senhas comuns e de senha que contém o e-mail.
- O Admin nunca escolhe nem conhece a senha definitiva de ninguém: só gera uma provisória, que obriga a troca no primeiro acesso (quem está com senha provisória não acessa nenhuma outra tela).
- Trocar a senha exige a senha atual e encerra as sessões dos outros aparelhos; redefinir ou desativar um usuário derruba as sessões dele.
- Sessão em cookie `HttpOnly` + `SameSite=Lax`; o banco guarda só o hash do token e a sessão expira em 8 h.
- Cada ação do servidor confere login e cargo, sem confiar no que a tela mostra.
- Freio de 5 tentativas erradas por e-mail e 20 por origem (IP) a cada 15 min, guardado no banco (vale mesmo na nuvem); a troca de senha tem o mesmo freio e mensagem de erro genérica no login.
- Totem e painel exigem um aparelho autorizado com a `DEVICE_KEY` (digitada uma vez em `/aparelho`, nunca na URL); sem a chave configurada, ficam fechados em produção. A API do painel e a emissão de senhas conferem a mesma autorização, e há um limite de 40 senhas por minuto.
- A numeração das senhas é protegida por trava no banco (dois toques simultâneos não geram o mesmo código) e o "dia" segue o fuso de Brasília, mesmo com o servidor em UTC.
- Cabeçalhos de segurança em todas as respostas (anti-clickjacking, anti-sniffing, política de referência e de permissões).
- Pesquisa de satisfação sem login: o link da senha é secreto (128 bits aleatórios), só abre após o atendimento, aceita uma resposta por senha e tudo é validado no servidor. Não guarda dado pessoal do paciente.
- Usuário desativado perde as sessões abertas na hora.

## Estrutura

```
prisma/schema.prisma   modelo de dados (Ticket, TicketEvent, User, Session, Feedback...)
prisma/migrations      histórico versionado do banco (aplicado no deploy)
prisma/create-admin.ts cria o primeiro administrador de um ambiente real
docs/DEPLOY.md         guia de publicação (Neon + Vercel)
src/lib/dates.ts       datas no fuso da clínica (com testes)
src/lib/device.ts      autorização de aparelhos (totem e painel)
src/lib/flow.ts        regras do fluxo: etapas, transições e salas
src/app/actions.ts     ações do servidor (criar senha, avançar etapa)
src/app/totem          tela do totem
src/app/(staff)/fila   tela da fila de atendimento (exige login)
src/app/(staff)/admin  gestão de usuários e cargos (só Admin)
src/app/(staff)/gestao painel de gestão (gráficos, alertas)
src/lib/metrics.ts     cálculo dos tempos por etapa, alertas e satisfação (com testes)
src/lib/feedback.ts    motivos da pesquisa e validação do formulário
src/app/avaliar        pesquisa de satisfação (pública, via QR code)
src/app/login          tela de login (marca, mostrar senha, Caps Lock)
src/app/(staff)/conta  minha conta: trocar senha e ver sessões
src/lib/passwordPolicy.ts regras e força da senha (com testes)
src/lib/auth.ts        exige login/cargo em páginas e ações
src/lib/session.ts     sessões em cookie HttpOnly + banco
src/lib/password.ts    hash de senha (scrypt)
src/app/painel         painel de chamada (TV)
src/app/api/painel     dados do painel em JSON
```
