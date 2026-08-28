# Barbearia La Fé — Sistema completo

Sistema real de gestão para a **Barbearia La Fé** (Jatiúca, Maceió/AL): site público com
agendamento online, motor de disponibilidade, bloqueios, painel administrativo, financeiro,
comissões, estoque, avaliações e integração com WhatsApp.

> **Banco oficial: Microsoft SQL Server 2019**, acessado pelo driver **`mssql`**.
> Todo o acesso passa por uma camada única (`src/lib/database/connection.ts`) com **connection pool**,
> **SQL 100% parametrizado** e **transações** nas operações críticas.

---

## 1. Stack

| Camada | Tecnologia |
| --- | --- |
| Front-end | Next.js (App Router) + React + TypeScript + Tailwind CSS |
| API | Next.js Route Handlers (`/src/app/api/**`) |
| Domínio | Controllers (rotas) → Services (`src/services`) → Repositories (`src/repositories`) → mssql |
| Banco | Microsoft SQL Server 2019 — banco **[la fe]** |
| Autenticação | bcrypt + JWT + cookie **HTTPOnly** |
| Validação | Zod |
| Segurança | rate limiting, cookies assinados, SQL parametrizado, tratamento global de erros |

O React **nunca** acessa o banco: o navegador recebe apenas JSON das rotas `/api/**` e nunca vê
string de conexão, senha, `JWT_SECRET` ou `password_hash`.

---

## 2. Instalação passo a passo

1. **Node.js 20+** — <https://nodejs.org>
2. **SQL Server 2019** (Developer/Express) — <https://www.microsoft.com/sql-server>
3. **SQL Server Management Studio (SSMS)** — para executar os scripts SQL
4. Crie/use o banco **[la fe]** (o script abaixo já cria se não existir)
5. Copie `.env.example` → `.env` e preencha
6. Instale as dependências e prepare o banco:

```bash
npm install
npm run db:test     # SELECT 1 -> "SQL Server conectado com sucesso."
npm run db:seed     # estrutura + seed + administrador (bcrypt)
npm run dev         # http://localhost:3000
```

Scripts SQL (executáveis pelo SSMS, na ordem):

| Script | Função |
| --- | --- |
| `database/01-create-database.sql` | cria o banco `[la fe]` |
| `database/02-create-tables.sql` | cria as 17 tabelas (IDENTITY, DECIMAL, TIME, DATE, DATETIME2) |
| `database/03-seed-data.sql` | barbeiros, serviços, produtos, horários e configurações oficiais |
| `database/04-indexes.sql` | índices de desempenho |
| `database/05-reset-database.sql` | **apaga tudo** — apenas desenvolvimento, nunca automático |

`npm run db:seed` é **idempotente** e nunca cria agendamentos, clientes ou faturamento fictício.

### Scripts npm

```
npm run dev        # desenvolvimento
npm start          # produção (next start)
npm run build      # build de produção
npm run db:test    # testa a conexão (SELECT 1)
npm run db:seed    # cria estrutura + seed + admin
npm run db:reset   # APAGA tudo (pede confirmação digitando RESET)
```

---

## 3. Variáveis de ambiente (`.env`)

```env
DB_CLIENT=mssql
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=la fe
DB_USER=SEU_USUARIO_SQL
DB_PASSWORD=SUA_SENHA_SQL
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=chave-forte
JWT_EXPIRES_IN=8h

ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@barbearialafe.com
ADMIN_PASSWORD=sua-senha
NEXT_PUBLIC_SHOP_WHATSAPP=5582981883520
```

**Como alterar:**

- **Servidor** → `DB_SERVER` (`localhost`, IP ou nome do servidor remoto)
- **Porta** → `DB_PORT` (1433 ou a que você configurou)
- **Usuário/senha SQL** → `DB_USER` / `DB_PASSWORD`
- **Banco** → `DB_DATABASE` (padrão `la fe`)
- **Login do painel** → `ADMIN_EMAIL` / `ADMIN_PASSWORD` (reexecute `npm run db:seed` após trocar)
- **Trocar localhost por servidor remoto** → altere apenas o `.env`, **sem mudar código**
- `DB_CLIENT=postgres` + `DATABASE_URL` selecionam o adaptador local usado quando não há SQL Server
  disponível (mesmo repositório SQL, mesmas regras de negócio).

Nunca commite o `.env` (está no `.gitignore`). Nenhuma credencial chega ao frontend.

---

## 4. Acesso

| Ambiente | URL |
| --- | --- |
| Site público | `/` |
| Agendamento online | `/agendamento` |
| Login do painel | `/login` |
| Painel | `/admin/dashboard` (protegido; 401 redireciona para `/login`) |

O administrador é criado por `npm run db:seed` (ou automaticamente no primeiro login) usando
`ADMIN_EMAIL` / `ADMIN_PASSWORD` com hash **bcrypt**. Nunca é retornado `password_hash`.

---

## 5. Motor de disponibilidade (regras reais)

Cada consulta de horários valida, no **backend**:

1. serviço existe e está ativo
2. barbeiro existe e está ativo
3. barbeiro realiza o serviço (`service_barbers`)
4. data válida, não passada, dentro da janela permitida
5. barbearia aberta no dia (`business_hours`)
6. barbeiro trabalha no dia (`barber_hours`)
7. bloqueio da barbearia (dia inteiro ou faixa)
8. bloqueio do barbeiro (folga, almoço, compromisso)
9. conflito com agendamentos existentes (duração do serviço)
10. horário termina antes do fechamento
11. novo recheck **dentro de transação com lock** ao gravar (concorrência)

Se outro cliente reservar o mesmo horário: `Este horário acabou de ser reservado. Escolha outro horário.`
Nenhum horário bloqueado, fora do expediente ou já ocupado pode ser reservado — a validação é
repetida no momento do `INSERT`.

### Tipos de bloqueio

`DIA_INTEIRO` (start/end `NULL`) · `HORARIO` · `ALMOCO` · `FOLGA` · `REUNIAO` · `MANUTENCAO` · `OUTRO`
Sobreposições inválidas são rejeitadas e bloquear um dia **não apaga** agendamentos existentes: o
painel mostra a lista de afetados e o administrador decide.

### Fluxo de status

`PENDENTE → CONFIRMADO → EM_ATENDIMENTO → CONCLUIDO` (ou `CANCELADO` / `NAO_COMPARECEU`)

Somente `CONCLUIDO` gera **receita** e **comissão** (`preço × percentual / 100`), criadas em uma
única transação SQL (com `appointment_id` único em `commissions`, sem duplicidade). Cancelar
remove receita/comissão. Vendas de produto reduzem estoque (nunca negativo) e geram receita.

---

## 6. API REST

```
GET    /api/health                         -> { success, message, database }
POST   /api/auth/login                     POST /api/auth/logout      GET /api/auth/me
GET    /api/services        POST /api/services            GET|PUT|DELETE /api/services/:id
GET    /api/barbers         POST /api/barbers             GET|PUT|DELETE /api/barbers/:id
GET    /api/barbers/:id/hours                              PUT /api/barbers/:id/hours
GET    /api/customers       POST /api/customers           GET|PUT|DELETE /api/customers/:id
GET    /api/customers/:id/history
GET    /api/products        POST /api/products            GET|PUT|DELETE /api/products/:id
POST   /api/products/:id/sell                              GET /api/sales
GET    /api/appointments    POST /api/appointments (público)
GET|PUT|PATCH|DELETE /api/appointments/:id
GET|POST /api/appointments/availability
GET    /api/commissions     GET /api/commissions/summary   PUT /api/commissions/:id/pay
GET    /api/finance         POST /api/finance              GET /api/finance/summary
GET    /api/reviews         POST /api/reviews              PUT /api/reviews/:id
GET|POST /api/business-hours                               PUT /api/business-hours/:id
GET|POST /api/blocked-times                                GET|PUT|DELETE /api/blocked-times/:id
GET    /api/dashboard       GET /api/reports               GET|PUT /api/settings
```

Resposta padrão: `{ "success": true, "data": {...} }` ou `{ "success": false, "message": "..." }`.

---

## 7. Estrutura

```
src/
  app/            site público, /login e /admin/** (dashboard, agendamentos, calendário,
                  clientes, barbeiros, serviços, produtos, comissões, financeiro, horários,
                  bloqueios, relatórios, configurações) + /api/**
  components/     UI e layout (site/admin)
  hooks/          useApi (fetch tipado, loading, erro)
  lib/database/   conexão única (mssql), pool, transações, health
  lib/auth/       bcrypt, JWT, cookie HTTPOnly, guards
  lib/validations schemas Zod
  lib/whatsapp/   montagem das mensagens wa.me
  repositories/   SQL parametrizado
  services/       regras de negócio (disponibilidade, agendamento, financeiro...)
  types/          tipos de domínio
database/         01..05 (SQL Server) + adaptador local
scripts/          db:test, db:seed, db:reset
```

## 8. WhatsApp

Sem API oficial nesta versão: o sistema monta a mensagem e abre `https://wa.me/<numero>?text=<mensagem>`
devidamente codificada, com nome, serviço, barbeiro, data, horário e valor — tanto para o cliente
(quando ele agenda) quanto para o administrador (no painel, botão “Enviar confirmação pelo WhatsApp”).
"# barbearia-la-fe" 
