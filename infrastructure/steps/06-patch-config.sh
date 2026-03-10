patch_config() {
  step "6/6  Actualizando archivos de configuración"

  # dev  → .env.development.local  (Next.js lo prioriza sobre .env.local en NODE_ENV=development)
  # prd  → .env.production.local   (Next.js lo prioriza sobre .env.local en NODE_ENV=production)
  local env_filename
  if [[ "$STAGE" == "prd" ]]; then
    env_filename=".env.production.local"
  else
    env_filename=".env.development.local"
  fi
  local env_file="${SCRIPT_DIR}/../${env_filename}"

  if grep -q "NEXT_PUBLIC_WEBSOCKET_URL" "$env_file" 2>/dev/null; then
    sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=${WS_WSS_URL}|" "$env_file"
  else
    echo "NEXT_PUBLIC_WEBSOCKET_URL=${WS_WSS_URL}" >> "$env_file"
  fi
  ok "${env_filename} → NEXT_PUBLIC_WEBSOCKET_URL actualizado"
}
