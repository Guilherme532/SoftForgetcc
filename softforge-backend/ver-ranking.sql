-- Ranking completo: melhor tentativa de cada nome (nota, depois menor tempo).
select * from (
  select distinct on (nickname_key)
         nickname as nome, score as nota, total, round(duration_ms / 1000.0, 1) as segundos
  from attempts
  where status = 'finished'
  order by nickname_key, score desc, duration_ms asc
) t
order by nota desc, segundos asc;

-- Quantas pessoas jogaram e quantas tentativas houve:
select count(distinct nickname_key) as pessoas, count(*) as tentativas from attempts where status = 'finished';

-- Avisos de WhatsApp enviados, falhos ou ignorados:
select status, count(*) from notifications group by status;
