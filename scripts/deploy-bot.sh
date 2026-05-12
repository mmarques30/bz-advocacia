#!/usr/bin/env bash
# Deploy das 5 Edge Functions do bot SDR (sem a meta-lead-webhook).
# Usar quando você ainda não está conectado ao Meta, ou quando quer
# atualizar só a parte do bot sem mexer na captura.

set -e

echo "→ Deploy do bot SDR (5 funções, sem Meta)"
echo

supabase functions deploy on-new-lead
echo "✓ on-new-lead"

supabase functions deploy whatsapp-inbound --no-verify-jwt
echo "✓ whatsapp-inbound"

supabase functions deploy assumir-conversa
echo "✓ assumir-conversa"

supabase functions deploy enviar-msg-humano
echo "✓ enviar-msg-humano"

supabase functions deploy cron-followup --no-verify-jwt
echo "✓ cron-followup"

echo
echo "Tudo no ar. Logs ao vivo:"
echo "  supabase functions logs on-new-lead --tail"
echo "  supabase functions logs whatsapp-inbound --tail"
