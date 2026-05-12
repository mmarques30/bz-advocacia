#!/usr/bin/env bash
# Deploy só da Edge Function meta-lead-webhook.
# Usar quando você for ligar a captura via Meta Lead Ads,
# depois de seguir o GUIA_META_LEAD_ADS.md.

set -e

echo "→ Deploy do webhook do Meta Lead Ads"
echo

# Validação rápida das secrets necessárias
required=(META_VERIFY_TOKEN META_PAGE_ACCESS_TOKEN META_APP_SECRET)
for v in "${required[@]}"; do
  if ! grep -q "^${v}=" .env 2>/dev/null; then
    echo "⚠ Variável $v não está no .env. Configure antes de fazer deploy."
    exit 1
  fi
done

supabase secrets set --env-file ./.env
supabase functions deploy meta-lead-webhook --no-verify-jwt
echo "✓ meta-lead-webhook"

echo
echo "Próximo passo: ir no painel do Facebook for Developers e validar o webhook."
echo "URL pra colar lá: https://<PROJECT_REF>.functions.supabase.co/meta-lead-webhook"
