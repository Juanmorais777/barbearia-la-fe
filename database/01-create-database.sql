/* =====================================================================
   BARBEARIA LA FÉ - 01 CREATE DATABASE
   Microsoft SQL Server 2019
   Banco oficial: [la fe]
   ===================================================================== */

IF DB_ID(N'la fe') IS NULL
BEGIN
    PRINT 'Criando banco de dados [la fe]...';
    CREATE DATABASE [la fe];
END
ELSE
    PRINT 'Banco de dados [la fe] ja existe. Nenhuma acao executada.';
GO

USE [la fe];
GO

IF SCHEMA_ID(N'app') IS NULL
    EXEC(N'CREATE SCHEMA app;');
GO

PRINT 'Banco [la fe] pronto.';
GO
