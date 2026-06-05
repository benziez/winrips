-- Fix stale image_url values on vault_items for Hidden Fates shiny vault pulls.
-- Run in Supabase SQL editor (project: zyqcvmjziyebiuazkggo).

-- Preview rows that will change
SELECT id, item_id, item_name, image_url
FROM public.vault_items
WHERE item_id IN ('pk-shiny-03', 'pk-shiny-04', 'pk-shiny-05')
ORDER BY item_id, created_at;

UPDATE public.vault_items
SET image_url = CASE item_id
  WHEN 'pk-shiny-03' THEN 'https://images.pokemontcg.io/sma/SV57_hires.png'
  WHEN 'pk-shiny-04' THEN 'https://images.pokemontcg.io/sma/SV39_hires.png'
  WHEN 'pk-shiny-05' THEN 'https://images.pokemontcg.io/sma/SV41_hires.png'
END
WHERE item_id IN ('pk-shiny-03', 'pk-shiny-04', 'pk-shiny-05')
  AND image_url IS DISTINCT FROM CASE item_id
    WHEN 'pk-shiny-03' THEN 'https://images.pokemontcg.io/sma/SV57_hires.png'
    WHEN 'pk-shiny-04' THEN 'https://images.pokemontcg.io/sma/SV39_hires.png'
    WHEN 'pk-shiny-05' THEN 'https://images.pokemontcg.io/sma/SV41_hires.png'
  END;

-- Verify
SELECT id, item_id, item_name, image_url
FROM public.vault_items
WHERE item_id IN ('pk-shiny-03', 'pk-shiny-04', 'pk-shiny-05')
ORDER BY item_id, created_at;
