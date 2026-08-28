-- =====================================================================
-- BARBEARIA LA FÉ - seed (adaptador local de desenvolvimento)
-- Idempotente. Nao cria agendamentos, clientes ou faturamento ficticio.
-- =====================================================================

INSERT INTO barbers (name, phone, specialty, bio, commission_percent)
SELECT * FROM (VALUES
    ('Carlos', '(82) 98888-1001', 'Cortes clássicos e degradê', 'Especialista em cortes clássicos, navalhado e degradê.', 40.00),
    ('João', '(82) 98888-1002', 'Barba e navalha', 'Mestre na arte da barba: toalha quente, navalha e acabamento.', 50.00),
    ('Rafael Costa', '(82) 98888-1003', 'Cortes modernos', 'Tendências, freestyle e degradê na régua.', 40.00),
    ('André Lima', '(82) 98888-1004', 'Química capilar', 'Platinado, luzes e tratamentos capilares.', 45.00)
) AS v(name, phone, specialty, bio, commission_percent)
WHERE NOT EXISTS (SELECT 1 FROM barbers b WHERE b.name = v.name);

INSERT INTO services (name, description, price, duration_minutes, category)
SELECT * FROM (VALUES
    ('Corte Masculino', 'Corte personalizado com acabamento na navalha e finalização.', 40.00, 40, 'Cabelo'),
    ('Corte + Barba', 'Combo completo: corte personalizado e design de barba com toalha quente.', 60.00, 60, 'Combo'),
    ('Design de Barba', 'Desenho e alinhamento da barba com navalha e óleo finalizador.', 35.00, 30, 'Barba'),
    ('Barba Terapia', 'Ritual completo de barba com toalha quente, esfoliação e massagem.', 45.00, 40, 'Barba'),
    ('Pézinho', 'Acabamento de nuca e contornos entre cortes.', 15.00, 15, 'Cabelo'),
    ('Corte Infantil', 'Corte para crianças com paciência e atenção da nossa equipe.', 40.00, 40, 'Infantil'),
    ('Degradê Premium', 'Degradê na régua com desenho e finalização premium.', 50.00, 50, 'Cabelo'),
    ('Platinado', 'Descoloração global com matização e tratamento.', 150.00, 150, 'Química'),
    ('Luzes / Mechas', 'Mechas na tesoura ou navalha com matização.', 120.00, 120, 'Química'),
    ('Hidratação Capilar', 'Hidratação profunda para cabelo e barba.', 50.00, 40, 'Tratamento'),
    ('Sobrancelha na navalha', 'Alinhamento de sobrancelha na navalha.', 15.00, 15, 'Estética')
) AS v(name, description, price, duration_minutes, category)
WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.name = v.name);

INSERT INTO service_barbers (service_id, barber_id)
SELECT s.id, b.id
FROM services s CROSS JOIN barbers b
WHERE b.active = 1
  AND s.name NOT IN ('Platinado', 'Luzes / Mechas')
  AND NOT EXISTS (SELECT 1 FROM service_barbers sb WHERE sb.service_id = s.id AND sb.barber_id = b.id);

INSERT INTO service_barbers (service_id, barber_id)
SELECT s.id, b.id
FROM services s JOIN barbers b ON b.name IN ('André Lima', 'Rafael Costa')
WHERE s.name IN ('Platinado', 'Luzes / Mechas')
  AND NOT EXISTS (SELECT 1 FROM service_barbers sb WHERE sb.service_id = s.id AND sb.barber_id = b.id);

INSERT INTO business_hours (day_of_week, open_time, close_time, is_closed)
SELECT v.day_of_week, v.open_time::time, v.close_time::time, v.is_closed
FROM (VALUES
    (0, NULL, NULL, 1),
    (1, '09:00', '21:00', 0),
    (2, '09:00', '17:00', 0),
    (3, '09:00', '17:00', 0),
    (4, '09:00', '17:00', 0),
    (5, '09:00', '17:00', 0),
    (6, '09:00', '17:00', 0)
) AS v(day_of_week, open_time, close_time, is_closed)
WHERE NOT EXISTS (SELECT 1 FROM business_hours bh WHERE bh.day_of_week = v.day_of_week);

INSERT INTO barber_hours (barber_id, day_of_week, start_time, end_time, is_closed)
SELECT b.id, h.day_of_week, h.open_time, h.close_time, h.is_closed
FROM barbers b JOIN business_hours h ON h.day_of_week BETWEEN 1 AND 6
WHERE NOT EXISTS (SELECT 1 FROM barber_hours bh WHERE bh.barber_id = b.id AND bh.day_of_week = h.day_of_week);

INSERT INTO products (name, description, price, stock, minimum_stock, category)
SELECT * FROM (VALUES
    ('Balm Da AlphaLook', 'Balm finalizador para barba com efeito matte e proteção.', 30.00, 12, 3, 'Barba'),
    ('Gel Cola Black Da Alpha Look', 'Gel de fixação extra forte, brilho natural e secagem rápida.', 38.99, 10, 3, 'Cabelo'),
    ('Pomada Modeladora AlphaLook', 'Pomada de fixação média com acabamento natural.', 34.90, 8, 3, 'Cabelo'),
    ('Óleo para Barba AlphaLook', 'Óleo nutritivo que amacia e controla o volume da barba.', 42.00, 6, 2, 'Barba')
) AS v(name, description, price, stock, minimum_stock, category)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = v.name);

INSERT INTO settings ("key", "value")
SELECT * FROM (VALUES
    ('business_name', 'Barbearia La Fé'),
    ('business_phone', '(82) 98188-3520'),
    ('business_whatsapp', '5582981883520'),
    ('business_address', 'Rua Soldado Eduardo dos Santos, 1201B - Jatiúca, Maceió/AL - CEP 57035-735'),
    ('business_instagram', 'barbearia_la_fe'),
    ('slot_step_minutes', '30'),
    ('booking_window_days', '60'),
    ('business_rating', '5.0')
) AS v("key", "value")
WHERE NOT EXISTS (SELECT 1 FROM settings s WHERE s."key" = v."key");
