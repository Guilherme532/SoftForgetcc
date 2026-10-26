-- Apaga TODOS os dados do quiz (respostas, ranking e registros de aviso).
-- Use depois do ensaio geral (27/10) e depois do evento (30/10).
delete from attempts;   -- answers e notifications saem junto (cascade)
