/* =====================================================================
   BARBEARIA LA FÉ - 05 RESET DATABASE
   ATENCAO: USO EXCLUSIVO EM DESENVOLVIMENTO.
   APAGA TODAS AS TABELAS E DADOS DO BANCO [la fe].
   NUNCA e executado automaticamente pela aplicacao.
   ===================================================================== */

USE [la fe];
GO

/* Desativa constraints para permitir o drop em qualquer ordem */
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

IF OBJECT_ID(N'dbo.commission_payments', N'U') IS NOT NULL DROP TABLE dbo.commission_payments;
IF OBJECT_ID(N'dbo.commissions', N'U') IS NOT NULL DROP TABLE dbo.commissions;
IF OBJECT_ID(N'dbo.transactions', N'U') IS NOT NULL DROP TABLE dbo.transactions;
IF OBJECT_ID(N'dbo.product_sales', N'U') IS NOT NULL DROP TABLE dbo.product_sales;
IF OBJECT_ID(N'dbo.reviews', N'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID(N'dbo.appointments', N'U') IS NOT NULL DROP TABLE dbo.appointments;
IF OBJECT_ID(N'dbo.blocked_times', N'U') IS NOT NULL DROP TABLE dbo.blocked_times;
IF OBJECT_ID(N'dbo.barber_hours', N'U') IS NOT NULL DROP TABLE dbo.barber_hours;
IF OBJECT_ID(N'dbo.business_hours', N'U') IS NOT NULL DROP TABLE dbo.business_hours;
IF OBJECT_ID(N'dbo.service_barbers', N'U') IS NOT NULL DROP TABLE dbo.service_barbers;
IF OBJECT_ID(N'dbo.services', N'U') IS NOT NULL DROP TABLE dbo.services;
IF OBJECT_ID(N'dbo.barbers', N'U') IS NOT NULL DROP TABLE dbo.barbers;
IF OBJECT_ID(N'dbo.customers', N'U') IS NOT NULL DROP TABLE dbo.customers;
IF OBJECT_ID(N'dbo.products', N'U') IS NOT NULL DROP TABLE dbo.products;
IF OBJECT_ID(N'dbo.settings', N'U') IS NOT NULL DROP TABLE dbo.settings;
IF OBJECT_ID(N'dbo.admins', N'U') IS NOT NULL DROP TABLE dbo.admins;
GO

EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL';
GO

PRINT 'Banco [la fe] limpo. Execute 01, 02, 03 e 04 para recriar.';
GO
