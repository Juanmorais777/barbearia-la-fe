/* =====================================================================
   BARBEARIA LA FÉ - 02 CREATE TABLES
   Microsoft SQL Server 2019  |  Banco: [la fe]
   Regras:
     - id INT IDENTITY(1,1) PRIMARY KEY
     - dinheiro  -> DECIMAL(10,2)
     - percentual-> DECIMAL(5,2)
     - hora      -> TIME
     - data      -> DATE
     - data+hora -> DATETIME2
     - nunca FLOAT para dinheiro
   ===================================================================== */

USE [la fe];
GO

/* ---------------------------- ADMINS ------------------------------- */
IF OBJECT_ID(N'dbo.admins', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.admins (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        name          NVARCHAR(120)  NOT NULL,
        email         NVARCHAR(160)  NOT NULL UNIQUE,
        password_hash NVARCHAR(200)  NOT NULL,
        role          NVARCHAR(20)   NOT NULL CONSTRAINT DF_admins_role DEFAULT (N'OWNER'),
        active        BIT            NOT NULL CONSTRAINT DF_admins_active DEFAULT (1),
        created_at    DATETIME2(0)   NOT NULL CONSTRAINT DF_admins_created DEFAULT (SYSDATETIME()),
        updated_at    DATETIME2(0)   NULL
    );
    PRINT 'Tabela admins criada.';
END
GO

/* --------------------------- CUSTOMERS ----------------------------- */
IF OBJECT_ID(N'dbo.customers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.customers (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        name       NVARCHAR(140)  NOT NULL,
        phone      NVARCHAR(30)   NOT NULL,
        email      NVARCHAR(160)  NULL,
        notes      NVARCHAR(500)  NULL,
        active     BIT            NOT NULL CONSTRAINT DF_customers_active DEFAULT (1),
        created_at DATETIME2(0)   NOT NULL CONSTRAINT DF_customers_created DEFAULT (SYSDATETIME()),
        updated_at DATETIME2(0)   NULL
    );
    PRINT 'Tabela customers criada.';
END
GO

/* ---------------------------- BARBERS ------------------------------ */
IF OBJECT_ID(N'dbo.barbers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.barbers (
        id                 INT IDENTITY(1,1) PRIMARY KEY,
        name               NVARCHAR(140)  NOT NULL,
        phone              NVARCHAR(30)   NULL,
        email              NVARCHAR(160)  NULL,
        photo              NVARCHAR(400)  NULL,
        specialty          NVARCHAR(200)  NULL,
        bio                NVARCHAR(600)  NULL,
        commission_percent DECIMAL(5,2)   NOT NULL CONSTRAINT DF_barbers_commission DEFAULT (40.00),
        active             BIT            NOT NULL CONSTRAINT DF_barbers_active DEFAULT (1),
        created_at         DATETIME2(0)   NOT NULL CONSTRAINT DF_barbers_created DEFAULT (SYSDATETIME()),
        updated_at         DATETIME2(0)   NULL
    );
    PRINT 'Tabela barbers criada.';
END
GO

/* ---------------------------- SERVICES ----------------------------- */
IF OBJECT_ID(N'dbo.services', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.services (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        name             NVARCHAR(140)  NOT NULL,
        description      NVARCHAR(600)  NULL,
        price            DECIMAL(10,2)  NOT NULL,
        duration_minutes INT            NOT NULL CONSTRAINT DF_services_duration DEFAULT (30),
        category         NVARCHAR(60)   NULL,
        active           BIT            NOT NULL CONSTRAINT DF_services_active DEFAULT (1),
        created_at       DATETIME2(0)   NOT NULL CONSTRAINT DF_services_created DEFAULT (SYSDATETIME()),
        updated_at       DATETIME2(0)   NULL
    );
    PRINT 'Tabela services criada.';
END
GO

/* ------------------------- SERVICE_BARBERS ------------------------- */
IF OBJECT_ID(N'dbo.service_barbers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.service_barbers (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        service_id INT NOT NULL CONSTRAINT FK_sb_service REFERENCES dbo.services(id),
        barber_id  INT NOT NULL CONSTRAINT FK_sb_barber  REFERENCES dbo.barbers(id),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_sb_created DEFAULT (SYSDATETIME()),
        CONSTRAINT UQ_service_barber UNIQUE (service_id, barber_id)
    );
    PRINT 'Tabela service_barbers criada.';
END
GO

/* ------------------------- BUSINESS_HOURS -------------------------- */
/* day_of_week: 0 = Domingo ... 6 = Sabado */
IF OBJECT_ID(N'dbo.business_hours', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.business_hours (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        day_of_week INT NOT NULL CONSTRAINT UQ_business_hours_day UNIQUE,
        open_time  TIME(0)   NULL,
        close_time TIME(0)   NULL,
        is_closed  BIT       NOT NULL CONSTRAINT DF_bh_closed DEFAULT (0),
        created_at DATETIME2(0) NOT NULL CONSTRAINT DF_bh_created DEFAULT (SYSDATETIME()),
        updated_at DATETIME2(0) NULL
    );
    PRINT 'Tabela business_hours criada.';
END
GO

/* -------------------------- BARBER_HOURS --------------------------- */
IF OBJECT_ID(N'dbo.barber_hours', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.barber_hours (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        barber_id   INT NOT NULL CONSTRAINT FK_bhrs_barber REFERENCES dbo.barbers(id),
        day_of_week INT NOT NULL,
        start_time  TIME(0)   NULL,
        end_time    TIME(0)   NULL,
        is_closed   BIT       NOT NULL CONSTRAINT DF_bhrs_closed DEFAULT (0),
        created_at  DATETIME2(0) NOT NULL CONSTRAINT DF_bhrs_created DEFAULT (SYSDATETIME()),
        updated_at  DATETIME2(0) NULL,
        CONSTRAINT UQ_barber_hours UNIQUE (barber_id, day_of_week)
    );
    PRINT 'Tabela barber_hours criada.';
END
GO

/* -------------------------- BLOCKED_TIMES -------------------------- */
/* type: DIA_INTEIRO | HORARIO | ALMOCO | FOLGA | REUNIAO | MANUTENCAO | OUTRO
   DIA_INTEIRO -> start_time e end_time NULL                          */
IF OBJECT_ID(N'dbo.blocked_times', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.blocked_times (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        barber_id  INT NULL CONSTRAINT FK_block_barber REFERENCES dbo.barbers(id),
        [date]     DATE        NOT NULL,
        start_time TIME(0)     NULL,
        end_time   TIME(0)     NULL,
        reason     NVARCHAR(240) NOT NULL,
        [type]     NVARCHAR(20)  NOT NULL CONSTRAINT DF_block_type DEFAULT (N'HORARIO'),
        active     BIT           NOT NULL CONSTRAINT DF_block_active DEFAULT (1),
        created_at DATETIME2(0)  NOT NULL CONSTRAINT DF_block_created DEFAULT (SYSDATETIME()),
        updated_at DATETIME2(0)  NULL
    );
    PRINT 'Tabela blocked_times criada.';
END
GO

/* -------------------------- APPOINTMENTS --------------------------- */
/* status: PENDENTE | CONFIRMADO | EM_ATENDIMENTO | CONCLUIDO | CANCELADO | NAO_COMPARECEU */
IF OBJECT_ID(N'dbo.appointments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.appointments (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        customer_id      INT NOT NULL CONSTRAINT FK_app_customer REFERENCES dbo.customers(id),
        barber_id        INT NOT NULL CONSTRAINT FK_app_barber   REFERENCES dbo.barbers(id),
        service_id       INT NOT NULL CONSTRAINT FK_app_service  REFERENCES dbo.services(id),
        appointment_date DATE        NOT NULL,
        start_time       TIME(0)     NOT NULL,
        end_time         TIME(0)     NOT NULL,
        [status]         NVARCHAR(20)    NOT NULL CONSTRAINT DF_app_status DEFAULT (N'PENDENTE'),
        price            DECIMAL(10,2)   NOT NULL,
        payment_method   NVARCHAR(20)    NULL,
        notes            NVARCHAR(400)   NULL,
        created_at       DATETIME2(0)    NOT NULL CONSTRAINT DF_app_created DEFAULT (SYSDATETIME()),
        updated_at       DATETIME2(0)    NULL
    );
    PRINT 'Tabela appointments criada.';
END
GO

/* ---------------------------- PRODUCTS ----------------------------- */
IF OBJECT_ID(N'dbo.products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        name           NVARCHAR(160)  NOT NULL,
        description    NVARCHAR(600)  NULL,
        price          DECIMAL(10,2)  NOT NULL,
        stock          INT            NOT NULL CONSTRAINT DF_prod_stock DEFAULT (0),
        minimum_stock  INT            NOT NULL CONSTRAINT DF_prod_min DEFAULT (2),
        category       NVARCHAR(60)   NULL,
        image          NVARCHAR(400)  NULL,
        active         BIT            NOT NULL CONSTRAINT DF_prod_active DEFAULT (1),
        created_at     DATETIME2(0)   NOT NULL CONSTRAINT DF_prod_created DEFAULT (SYSDATETIME()),
        updated_at     DATETIME2(0)   NULL
    );
    PRINT 'Tabela products criada.';
END
GO

/* ------------------------- PRODUCT_SALES --------------------------- */
IF OBJECT_ID(N'dbo.product_sales', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_sales (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        product_id     INT NOT NULL CONSTRAINT FK_sale_product REFERENCES dbo.products(id),
        barber_id      INT NULL CONSTRAINT FK_sale_barber   REFERENCES dbo.barbers(id),
        customer_id    INT NULL CONSTRAINT FK_sale_customer REFERENCES dbo.customers(id),
        quantity       INT           NOT NULL CONSTRAINT DF_sale_qty DEFAULT (1),
        unit_price     DECIMAL(10,2) NOT NULL,
        total          DECIMAL(10,2) NOT NULL,
        payment_method NVARCHAR(20)  NOT NULL CONSTRAINT DF_sale_pay DEFAULT (N'DINHEIRO'),
        created_at     DATETIME2(0)  NOT NULL CONSTRAINT DF_sale_created DEFAULT (SYSDATETIME())
    );
    PRINT 'Tabela product_sales criada.';
END
GO

/* --------------------------- COMMISSIONS --------------------------- */
/* Comissao nasce apenas quando o agendamento fica CONCLUIDO (1x por atendimento) */
IF OBJECT_ID(N'dbo.commissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.commissions (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        appointment_id INT NOT NULL CONSTRAINT FK_comm_app UNIQUE REFERENCES dbo.appointments(id),
        barber_id      INT NOT NULL CONSTRAINT FK_comm_barber REFERENCES dbo.barbers(id),
        base_amount    DECIMAL(10,2) NOT NULL,
        percent        DECIMAL(5,2)  NOT NULL,
        amount         DECIMAL(10,2) NOT NULL,
        [status]       NVARCHAR(20)  NOT NULL CONSTRAINT DF_comm_status DEFAULT (N'PENDENTE'),
        paid_at        DATETIME2(0)  NULL,
        created_at     DATETIME2(0)  NOT NULL CONSTRAINT DF_comm_created DEFAULT (SYSDATETIME()),
        updated_at     DATETIME2(0)  NULL
    );
    PRINT 'Tabela commissions criada.';
END
GO

/* ---------------------- COMMISSION_PAYMENTS ------------------------ */
IF OBJECT_ID(N'dbo.commission_payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.commission_payments (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        commission_id INT NOT NULL CONSTRAINT FK_pay_comm REFERENCES dbo.commissions(id),
        barber_id     INT NOT NULL CONSTRAINT FK_pay_barber REFERENCES dbo.barbers(id),
        amount        DECIMAL(10,2) NOT NULL,
        note          NVARCHAR(300) NULL,
        paid_by       INT NULL,
        paid_at       DATETIME2(0)  NOT NULL CONSTRAINT DF_cpay_paid DEFAULT (SYSDATETIME()),
        created_at    DATETIME2(0)  NOT NULL CONSTRAINT DF_cpay_created DEFAULT (SYSDATETIME())
    );
    PRINT 'Tabela commission_payments criada.';
END
GO

/* -------------------------- TRANSACTIONS --------------------------- */
/* type: INCOME | EXPENSE
   method: DINHEIRO | CREDITO | DEBITO | PIX                          */
IF OBJECT_ID(N'dbo.transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.transactions (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        [type]           NVARCHAR(10)  NOT NULL,
        category         NVARCHAR(60)  NOT NULL CONSTRAINT DF_tx_cat DEFAULT (N'OUTROS'),
        description      NVARCHAR(240) NOT NULL,
        amount           DECIMAL(10,2) NOT NULL,
        payment_method   NVARCHAR(20)  NULL,
        reference_type   NVARCHAR(30)  NULL,
        reference_id     INT NULL,
        transaction_date DATE          NOT NULL CONSTRAINT DF_tx_date DEFAULT (CAST(SYSDATETIME() AS DATE)),
        created_by       INT NULL,
        created_at       DATETIME2(0)  NOT NULL CONSTRAINT DF_tx_created DEFAULT (SYSDATETIME())
    );
    PRINT 'Tabela transactions criada.';
END
GO

/* ---------------------------- REVIEWS ------------------------------ */
IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reviews (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        customer_id    INT NULL CONSTRAINT FK_rev_customer REFERENCES dbo.customers(id),
        appointment_id INT NULL CONSTRAINT FK_rev_app      REFERENCES dbo.appointments(id),
        customer_name  NVARCHAR(140) NOT NULL,
        rating         TINYINT       NOT NULL CONSTRAINT CK_rev_rating CHECK (rating BETWEEN 1 AND 5),
        comment        NVARCHAR(800) NULL,
        approved       BIT           NOT NULL CONSTRAINT DF_rev_approved DEFAULT (0),
        active         BIT           NOT NULL CONSTRAINT DF_rev_active DEFAULT (1),
        created_at     DATETIME2(0)  NOT NULL CONSTRAINT DF_rev_created DEFAULT (SYSDATETIME())
    );
    PRINT 'Tabela reviews criada.';
END
GO

/* ---------------------------- SETTINGS ----------------------------- */
IF OBJECT_ID(N'dbo.settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.settings (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        [key]      NVARCHAR(60)   NOT NULL UNIQUE,
        [value]    NVARCHAR(400)  NULL,
        updated_at DATETIME2(0)   NULL
    );
    PRINT 'Tabela settings criada.';
END
GO

PRINT 'Estrutura de tabelas da Barbearia La Fé criada com sucesso.';
GO
