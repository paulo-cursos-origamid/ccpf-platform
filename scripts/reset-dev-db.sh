#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="infrastructure/docker/compose.dev.yaml"

echo
echo "=============================================="
echo " RESET DO BANCO DE DESENVOLVIMENTO - CCPF"
echo "=============================================="
echo
echo "Este processo APAGARÁ os dados do banco utilizado"
echo "pela API e recriará a estrutura pelas migrações."
echo
echo "Depois executará os seeds configurados no Prisma:"
echo "  1. prisma/seed.ts"
echo "  2. prisma/seed-system-owner.ts"
echo "  3. prisma/seed-categories.ts"
echo

# Validar a configuração do Docker Compose.
docker compose -f "$COMPOSE_FILE" config --quiet

# Confirmar que a API está em execução.
if ! docker compose -f "$COMPOSE_FILE" ps --status running --services \
  | grep -qx 'api'; then
  echo "ERRO: o serviço api não está em execução."
  echo "Inicie o ambiente de desenvolvimento e tente novamente."
  exit 1
fi

# Verificar o Prisma e o schema dentro do container.
docker compose -f "$COMPOSE_FILE" exec -T api sh -lc '
  test -x node_modules/.bin/prisma &&
  test -f prisma/schema.prisma
' || {
  echo "ERRO: Prisma ou schema não encontrado no container da API."
  exit 1
}

echo
read -r -p 'Para confirmar a exclusão dos dados, digite RESET CCPF DEV: ' CONFIRMATION

if [[ "$CONFIRMATION" != "RESET CCPF DEV" ]]; then
  echo "Operação cancelada. Nenhuma etapa destrutiva foi executada."
  exit 0
fi

echo
echo "========== ETAPA 1/2: RESET E MIGRAÇÕES =========="

docker compose -f "$COMPOSE_FILE" exec -T api sh -lc '
  npx prisma migrate reset \
    --force \
    --skip-seed \
    --schema prisma/schema.prisma
'

echo
echo "========== ETAPA 2/2: EXECUÇÃO DOS SEEDS =========="

docker compose -f "$COMPOSE_FILE" exec -T api sh -lc '
  npx prisma db seed --schema prisma/schema.prisma
'

echo
echo "=============================================="
echo " RESET E SEEDS CONCLUÍDOS COM SUCESSO"
echo "=============================================="
