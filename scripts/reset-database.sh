#!/usr/bin/env bash

set -Eeuo pipefail

ROOT="/home/paulo-developer/PROJECTS/ccpf-platform"
COMPOSE="infrastructure/docker/compose.dev.yaml"

cd "$ROOT"

echo
echo "=================================================="
echo " CCPF - RESET DO BANCO DE DESENVOLVIMENTO"
echo "=================================================="
echo
echo "ATENÇÃO: todos os dados do banco ccpf serão apagados."
echo

read -r -p 'Digite RESETAR para confirmar: ' CONFIRM

if [[ "$CONFIRM" != "RESETAR" ]]; then
  echo "Operação cancelada."
  exit 0
fi

echo
echo "========== 1. VALIDANDO AMBIENTE =========="

if [[ ! -f "$COMPOSE" ]]; then
  echo "ERRO: arquivo Docker Compose não encontrado: $COMPOSE"
  exit 1
fi

docker compose -f "$COMPOSE" config --quiet

echo
echo "========== 2. INICIANDO SERVIÇOS =========="

docker compose -f "$COMPOSE" up -d postgres api

echo
echo "========== 3. VALIDANDO PRISMA =========="

docker compose -f "$COMPOSE" exec -T api \
  npx prisma validate --schema prisma/schema.prisma

docker compose -f "$COMPOSE" exec -T api \
  npx prisma generate --schema prisma/schema.prisma

echo
echo "========== 4. RESETANDO BANCO E APLICANDO MIGRAÇÕES =========="

docker compose -f "$COMPOSE" exec -T api \
  npx prisma migrate reset \
  --force \
  --skip-seed \
  --schema prisma/schema.prisma

echo
echo "========== 5. EXECUTANDO SEEDS =========="

echo
echo "--- 5.1 Seed principal: usuário, permissões e planos ---"

docker compose -f "$COMPOSE" exec -T api \
  npx ts-node prisma/seed.ts

echo
echo "--- 5.2 Seed do Tenant SYSTEM_OWNER ---"

docker compose -f "$COMPOSE" exec -T api \
  npx ts-node prisma/seed-system-owner.ts

echo
echo "--- 5.3 Seed de categorias e subcategorias ---"

docker compose -f "$COMPOSE" exec -T api \
  npx ts-node prisma/seed-categories.ts

echo
echo "========== 6. VERIFICANDO TENANT E ASSINATURA =========="

docker compose -f "$COMPOSE" exec -T postgres \
  psql -U postgres -d ccpf -v ON_ERROR_STOP=1 -P pager=off -c '
    SELECT
      t.name AS tenant,
      t.slug,
      u.email AS owner_email,
      tm.role AS tenant_role,
      p.code AS plan_code,
      s.status AS subscription_status,
      (ba.id IS NOT NULL) AS has_billing_account
    FROM "Tenant" t
    LEFT JOIN "TenantMember" tm
      ON tm."tenantId" = t.id
    LEFT JOIN "User" u
      ON u.id = tm."userId"
    LEFT JOIN "Subscription" s
      ON s."tenantId" = t.id
    LEFT JOIN "Plan" p
      ON p.id = s."planId"
    LEFT JOIN "BillingAccount" ba
      ON ba.id = t."billingAccountId"
    WHERE t.slug = '\''ccpf-system-owner'\''
    ORDER BY s."createdAt" DESC NULLS LAST;
  '

echo
echo "========== 7. VERIFICANDO CATEGORIAS =========="

docker compose -f "$COMPOSE" exec -T postgres \
  psql -U postgres -d ccpf -v ON_ERROR_STOP=1 -P pager=off -c '
    SELECT
      t.name AS tenant,
      COUNT(DISTINCT c.id) AS categories
    FROM "Tenant" t
    LEFT JOIN "Category" c
      ON c."tenantId" = t.id
    WHERE t.slug = '\''ccpf-system-owner'\''
    GROUP BY t.id, t.name;
  '

echo
echo "========== 8. VERIFICANDO PLANOS =========="

docker compose -f "$COMPOSE" exec -T postgres \
  psql -U postgres -d ccpf -v ON_ERROR_STOP=1 -P pager=off -c '
    SELECT code, name
    FROM "Plan"
    ORDER BY code;
  '

echo
echo "=================================================="
echo " RESET E SEEDS CONCLUÍDOS."
echo " Confira as verificações acima."
echo "=================================================="
