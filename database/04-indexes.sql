/* =====================================================================
   BARBEARIA LA FÉ - 04 INDEXES
   ===================================================================== */

USE [la fe];
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_date')
    CREATE INDEX IX_appointments_date ON dbo.appointments (appointment_date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_barber_date')
    CREATE INDEX IX_appointments_barber_date ON dbo.appointments (barber_id, appointment_date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_status')
    CREATE INDEX IX_appointments_status ON dbo.appointments ([status]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_appointments_customer')
    CREATE INDEX IX_appointments_customer ON dbo.appointments (customer_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocked_times_date')
    CREATE INDEX IX_blocked_times_date ON dbo.blocked_times ([date]);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_blocked_times_active')
    CREATE INDEX IX_blocked_times_active ON dbo.blocked_times (active, [date]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tx_date')
    CREATE INDEX IX_tx_date ON dbo.transactions (transaction_date);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tx_type')
    CREATE INDEX IX_tx_type ON dbo.transactions ([type], transaction_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_commissions_status')
    CREATE INDEX IX_commissions_status ON dbo.commissions ([status], barber_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_phone')
    CREATE INDEX IX_customers_phone ON dbo.customers (phone);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_name')
    CREATE INDEX IX_customers_name ON dbo.customers (name);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_sales_created')
    CREATE INDEX IX_sales_created ON dbo.product_sales (created_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_reviews_approved')
    CREATE INDEX IX_reviews_approved ON dbo.reviews (approved, active);

PRINT 'Índices criados.';
GO
