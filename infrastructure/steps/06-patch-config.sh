patch_config() {
  step "6/6  Actualizando archivos de configuración"

  # Actualizar NEXT_PUBLIC_WEBSOCKET_URL en .env.local
  local ENV_FILE="${SCRIPT_DIR}/../.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    if grep -q "NEXT_PUBLIC_WEBSOCKET_URL" "$ENV_FILE"; then
      sed -i "s|NEXT_PUBLIC_WEBSOCKET_URL=.*|NEXT_PUBLIC_WEBSOCKET_URL=${WS_WSS_URL}|" "$ENV_FILE"
    else
      echo "NEXT_PUBLIC_WEBSOCKET_URL=${WS_WSS_URL}" >> "$ENV_FILE"
    fi
    ok ".env.local → NEXT_PUBLIC_WEBSOCKET_URL actualizado"
  fi
}
