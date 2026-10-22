# Publicando o ClinicaFluxo na internet

Caminho sugerido: **Neon** (banco PostgreSQL) + **Vercel** (o site). Os dois têm plano gratuito e conversam bem com este projeto. As partes que exigem **criar conta** são suas; o resto já está pronto no código.

> **Aviso importante.** Este projeto usa dados **fictícios**. Antes de colocar dados reais de pacientes é preciso um acordo formal com a clínica e atenção à LGPD (base legal, contrato com os provedores, backups, quem pode ver o quê). Além disso, o plano gratuito da Vercel (Hobby) é para uso **não comercial**; uma clínica real exigiria um plano pago ou outro servidor.

## O que já está pronto no código

- Banco **PostgreSQL** com migrações versionadas (`prisma/migrations`).
- A Vercel roda `vercel-build`: aplica as migrações pendentes e depois gera o site.
- **Totem e painel protegidos** por chave de aparelho (`DEVICE_KEY`): sem ela, ficam bloqueados.
- Freio de tentativas de login guardado no banco.
- Datas no fuso de Brasília (o servidor da nuvem usa UTC).
- Cabeçalhos de segurança e `vercel.json` com a região de São Paulo.

## Passo a passo

### 1. Banco no Neon

1. Crie uma conta em <https://neon.tech> e um projeto. Escolha a região **AWS South America (São Paulo)**.
2. No painel do projeto, abra **Connect** e copie **duas** URLs:
   - **Pooled connection** (o host contém `-pooler`) → será a `DATABASE_URL`. Acrescente ao final `&pgbouncer=true&connect_timeout=15`.
   - **Direct connection** → será a `DIRECT_URL`.

### 2. Site na Vercel

1. Crie uma conta em <https://vercel.com> entrando com o seu GitHub.
2. **Add New → Project** e importe o repositório `clinica-fluxo`.
3. Em **Environment Variables**, cadastre:

   | Nome           | Valor                                                |
   | -------------- | ---------------------------------------------------- |
   | `DATABASE_URL` | URL com pooler do Neon (passo 1)                     |
   | `DIRECT_URL`   | URL direta do Neon (passo 1)                         |
   | `DEVICE_KEY`   | uma chave secreta longa, gerada com o comando abaixo |

   Para gerar a chave (PowerShell):

   ```powershell
   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
   ```

   Guarde a chave num lugar seguro (gerenciador de senhas): você vai digitá-la em cada tablet/TV.

4. Clique em **Deploy**. O primeiro deploy cria as tabelas no banco automaticamente.

### 3. Criar o primeiro administrador

No seu computador, aponte para o banco do Neon e rode o script (ele **não** usa senha fixa):

```powershell
$env:DATABASE_URL = "<URL direta do Neon>"
$env:ADMIN_NAME = "Seu Nome"
$env:ADMIN_EMAIL = "voce@exemplo.com"
$env:ADMIN_PASSWORD = "<senha forte, mínimo 12 caracteres>"
npm run create-admin
```

Entre no site em `/login` com esse e-mail e crie os demais usuários em **Usuários**. Não rode `npm run seed` nem `npm run seed:demo` em produção (os dois se recusam a rodar).

### 4. Autorizar o totem e a TV

Em **cada** tablet/TV, abra `https://SEU-SITE.vercel.app/aparelho`, digite a `DEVICE_KEY`, escolha se o aparelho é **Totem** ou **Painel** e confirme. O aparelho guarda um cookie por 1 ano. Para revogar todos de uma vez, troque a `DEVICE_KEY` na Vercel e faça um novo deploy.

Na TV, toque uma vez em **Ativar som e voz** (regra dos navegadores).

### 5. Conferir

- [ ] `/login` funciona com o admin criado.
- [ ] `/totem` num aparelho **não** autorizado mostra "Aparelho não autorizado".
- [ ] A senha impressa tem QR code e ele abre a pesquisa no celular (o endereço já é público).
- [ ] `/gestao` abre para o Gestor e para o Admin.

## Desenvolvimento local

```bash
npm install
cp .env.example .env     # no Windows: copy .env.example .env
npm run db:up            # sobe o PostgreSQL no Docker (porta 5433)
npm run db:migrate       # cria as tabelas
npm run seed             # usuários fictícios
npm run seed:demo        # opcional: ~600 senhas fictícias
npm run dev
```

Se a porta `5433` estiver ocupada, troque-a em `docker-compose.yml` e no `.env`.

## Problemas comuns

- **O build falha em `prisma migrate deploy`**: confira se `DIRECT_URL` está cadastrada e é a conexão **direta** (sem `-pooler`).
- **"Aparelho não autorizado" mesmo com a chave certa**: a `DEVICE_KEY` precisa ter pelo menos 16 caracteres.
- **Erros de conexão esporádicos**: use a URL com `-pooler` e `pgbouncer=true` em `DATABASE_URL`.
- **Horários 3 h deslocados**: não deveria acontecer (o fuso é tratado em `src/lib/dates.ts`); se acontecer, abra uma issue.
