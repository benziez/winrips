-- Raise The 1999 God Pack list price to $150 (15_000 gems) in boxes.
update public.boxes
set cost = 15000
where id in ('god-pack-1999', '1999-god');
