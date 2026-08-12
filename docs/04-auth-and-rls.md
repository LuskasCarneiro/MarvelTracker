# 04 — Auth & RLS (futuro)

**Estado: não existe backend. Nada a fazer agora.**

A app é 100% client-side; dados do utilizador em `localStorage`. Este ficheiro existe
só para não se perder o horizonte:

- Se um dia houver sync multi-dispositivo ou partilha pública de logs, entra um
  backend leve (Supabase seria a escolha natural: Auth + Row Level Security por
  utilizador, tabela `logs(user_id, media_key, watched_at, rating)`).
- Publicação estática (GitHub Pages/Netlify) não precisa de nada disto — a pipeline
  TMDb é build-time e a key nunca é shipped.
- Regra: **nenhuma credencial em código shipped** mantém-se mesmo sem backend —
  `.env` continua gitignored.

Decisão real fica para quando houver um caso de uso concreto. YAGNI até lá.
