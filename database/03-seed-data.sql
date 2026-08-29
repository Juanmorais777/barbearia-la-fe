/* =====================================================================
   BARBEARIA LA FÉ - 03 SEED DATA
   Microsoft SQL Server 2019 | Banco: [la fe]
   Idempotente: pode ser executado varias vezes sem duplicar dados.
   NAO insere agendamentos, clientes, vendas, comissoes ou faturamento.
   ===================================================================== */

USE [la fe];
GO

/* ---------------------------- BARBEIROS ---------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.barbers WHERE name = N'Carlos')
    INSERT INTO dbo.barbers (name, phone, specialty, bio, commission_percent)
    VALUES (N'Carlos', N'(82) 98888-1001', N'Cortes classicos e degradê', N'Especialista em cortes clássicos, navalhado e degradê.', 40.00);

IF NOT EXISTS (SELECT 1 FROM dbo.barbers WHERE name = N'João')
    INSERT INTO dbo.barbers (name, phone, specialty, bio, commission_percent)
    VALUES (N'João', N'(82) 98888-1002', N'Barba e navalha', N'Mestre na arte da barba: toalha quente, navalha e acabamento.', 50.00);

IF NOT EXISTS (SELECT 1 FROM dbo.barbers WHERE name = N'Rafael Costa')
    INSERT INTO dbo.barbers (name, phone, specialty, bio, commission_percent)
    VALUES (N'Rafael Costa', N'(82) 98888-1003', N'Cortes modernos', N'Tendências, freestyle e degradê na régua.', 40.00);

IF NOT EXISTS (SELECT 1 FROM dbo.barbers WHERE name = N'André Lima')
    INSERT INTO dbo.barbers (name, phone, specialty, bio, commission_percent)
    VALUES (N'André Lima', N'(82) 98888-1004', N'Química capilar', N'Platinado, luzes e tratamentos capilares.', 45.00);
GO

/* ---------------------------- SERVIÇOS ----------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Corte Masculino')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Corte Masculino', N'Corte personalizado com acabamento na navalha e finalização.', 40.00, 40, N'Cabelo');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Corte + Barba')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Corte + Barba', N'Combo completo: corte personalizado e design de barba com toalha quente.', 60.00, 60, N'Combo');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Design de Barba')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Design de Barba', N'Desenho e alinhamento da barba com navalha e óleo finalizador.', 35.00, 30, N'Barba');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Barba Terapia')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Barba Terapia', N'Ritual completo de barba com toalha quente, esfoliação e massagem.', 45.00, 40, N'Barba');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Pézinho')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Pézinho', N'Acabamento de nuca e contornos entre cortes.', 15.00, 15, N'Cabelo');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Corte Infantil')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Corte Infantil', N'Corte para crianças com paciência e atenção da nossa equipe.', 40.00, 40, N'Infantil');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Degradê Premium')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Degradê Premium', N'Degradê na régua com desenho e finalização premium.', 50.00, 50, N'Cabelo');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Platinado')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Platinado', N'Descoloração global com matização e tratamento.', 150.00, 150, N'Química');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Luzes / Mechas')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Luzes / Mechas', N'Mechas na tesoura ou navalha com matização.', 120.00, 120, N'Química');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Hidratação Capilar')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Hidratação Capilar', N'Hidratação profunda para cabelo e barba.', 50.00, 40, N'Tratamento');

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Sobrancelha na navalha')
    INSERT INTO dbo.services (name, description, price, duration_minutes, category)
    VALUES (N'Sobrancelha na navalha', N'Alinhamento de sobrancelha na navalha.', 15.00, 15, N'Estética');
GO

/* ------------------- RELACAO SERVICO x BARBEIRO -------------------- */
INSERT INTO dbo.service_barbers (service_id, barber_id)
SELECT s.id, b.id
FROM dbo.services s
CROSS JOIN dbo.barbers b
WHERE b.active = 1
  AND s.name NOT IN (N'Platinado', N'Luzes / Mechas')
  AND NOT EXISTS (SELECT 1 FROM dbo.service_barbers sb WHERE sb.service_id = s.id AND sb.barber_id = b.id);

INSERT INTO dbo.service_barbers (service_id, barber_id)
SELECT s.id, b.id
FROM dbo.services s
JOIN dbo.barbers b ON b.name IN (N'André Lima', N'Rafael Costa')
WHERE s.name IN (N'Platinado', N'Luzes / Mechas')
  AND NOT EXISTS (SELECT 1 FROM dbo.service_barbers sb WHERE sb.service_id = s.id AND sb.barber_id = b.id);
GO

/* --------------------- HORARIOS DA BARBEARIA ----------------------- */
/* 0 = Domingo ... 6 = Sabado */
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 0)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (0, NULL, NULL, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 1)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (1, '09:00:00', '21:00:00', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 2)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (2, '09:00:00', '17:00:00', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 3)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (3, '09:00:00', '17:00:00', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 4)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (4, '09:00:00', '17:00:00', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 5)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (5, '09:00:00', '17:00:00', 0);
IF NOT EXISTS (SELECT 1 FROM dbo.business_hours WHERE day_of_week = 6)
    INSERT INTO dbo.business_hours (day_of_week, open_time, close_time, is_closed) VALUES (6, '09:00:00', '17:00:00', 0);
GO

/* ------------------- HORARIOS INDIVIDUAIS -------------------------- */
/* Se o barbeiro nao tiver horario proprio, vale o horario da barbearia. */
INSERT INTO dbo.barber_hours (barber_id, day_of_week, start_time, end_time, is_closed)
SELECT b.id, h.day_of_week, h.open_time, h.close_time, h.is_closed
FROM dbo.barbers b
JOIN dbo.business_hours h ON h.day_of_week BETWEEN 1 AND 6
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.barber_hours bh WHERE bh.barber_id = b.id AND bh.day_of_week = h.day_of_week
);
GO

/* ---------------------------- PRODUTOS ----------------------------- */
IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name = N'Balm Da AlphaLook')
    INSERT INTO dbo.products (name, description, price, stock, minimum_stock, category)
    VALUES (N'Balm Da AlphaLook', N'Balm finalizador para barba com efeito matte e proteção.', 30.00, 12, 3, N'Barba');

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name = N'Gel Cola Black Da Alpha Look')
    INSERT INTO dbo.products (name, description, price, stock, minimum_stock, category)
    VALUES (N'Gel Cola Black Da Alpha Look', N'Gel de fixação extra forte, brilho natural e secagem rápida.', 38.99, 10, 3, N'Cabelo');

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name = N'Pomada Modeladora AlphaLook')
    INSERT INTO dbo.products (name, description, price, stock, minimum_stock, category)
    VALUES (N'Pomada Modeladora AlphaLook', N'Pomada de fixação média com acabamento natural.', 34.90, 8, 3, N'Cabelo');

IF NOT EXISTS (SELECT 1 FROM dbo.products WHERE name = N'Óleo para Barba AlphaLook')
    INSERT INTO dbo.products (name, description, price, stock, minimum_stock, category)
    VALUES (N'Óleo para Barba AlphaLook', N'Óleo nutritivo que amacia e controla o volume da barba.', 42.00, 6, 2, N'Barba');
GO

/* ------------------------- CONFIGURAÇÕES --------------------------- */

INSERT INTO settings ("key", "value")
VALUES
  ('business_name', 'Barbearia La Fé'),
  ('business_phone', '(82) 98188-3520'),
  ('business_whatsapp', '5582981883520'),
  ('business_address', 'Rua Soldado Eduardo dos Santos, 1201B - Jatiúca, Maceió/AL - CEP 57035-735'),
  ('business_instagram', 'barbearia_la_fe'),
  ('slot_step_minutes', '30'),
  ('booking_window_days', '60'),
  ('business_rating', '5.0')
ON CONFLICT ("key")
DO UPDATE SET
  "value" = EXCLUDED."value",
  updated_at = CURRENT_TIMESTAMP;
PRINT 'Seed da Barbearia La Fé executado com sucesso.';
GO
