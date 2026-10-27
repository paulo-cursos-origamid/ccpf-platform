#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="/home/paulo-developer/PROJECTS/ccpf-platform"
COMPOSE="infrastructure/docker/compose.dev.yaml"
DC=(docker compose -f "$COMPOSE")

cd "$ROOT"

echo
echo "=================================================="
echo " CCPF - RESET DO BANCO DE DESENVOLVIMENTO"
echo "=================================================="
echo "ATENÇÃO: os dados do banco serão apagados."
echo

read -r -p 'Digite RESETAR para confirmar: ' CONFIRM
[[ "$CONFIRM" == "RESETAR" ]] || {
  echo "Operação cancelada."
  exit 0
}

[[ -f "$COMPOSE" ]] || {
  echo "ERRO: Compose não encontrado: $COMPOSE"
  exit 1
}

echo
echo "========== 1. VALIDANDO AMBIENTE =========="
"${DC[@]}" config --quiet

echo
echo "========== 2. REMOVENDO CONTAINERS E VOLUMES =========="
"${DC[@]}" down -v

echo
echo "========== 3. INICIANDO POSTGRES =========="
"${DC[@]}" up -d postgres
"${DC[@]}" build api

echo "Aguardando PostgreSQL..."
READY=0
for i in $(seq 1 60); do
  if "${DC[@]}" exec -T postgres pg_isready -U postgres -d ccpf >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

if [[ "$READY" != "1" ]]; then
  echo "ERRO: PostgreSQL não ficou pronto."
  "${DC[@]}" logs --tail=60 postgres
  exit 1
fi

# Executa comandos Prisma em containers temporários.
prisma() {
  "${DC[@]}" run --rm --no-deps api npx prisma "$@"
}

seed() {
  "${DC[@]}" run --rm --no-deps api npx ts-node "$1"
}

echo
echo "========== 3. VALIDANDO E GERANDO PRISMA =========="
prisma validate --schema prisma/schema.prisma
prisma generate --schema prisma/schema.prisma

echo
echo "========== 4. RESETANDO BANCO E MIGRANDO =========="
prisma migrate reset --force --skip-seed --schema prisma/schema.prisma

echo
echo "========== 5. EXECUTANDO SEEDS =========="
echo "--- 5.1 Seed principal ---"
seed prisma/seed.ts

echo "--- 5.2 Seed SYSTEM_OWNER ---"
seed prisma/seed-system-owner.ts

echo "--- 5.3 Seed de categorias ---"
seed prisma/seed-categories.ts

echo
echo "========== 6. VERIFICANDO TENANT E ASSINATURA =========="
"${DC[@]}" exec -T postgres psql -U postgres -d ccpf \
  -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
SELECT
  t.name AS tenant,
  t.slug,
  u.email AS owner_email,
  tm.role AS tenant_role,
  p.code AS plan_code,
  s.status AS subscription_status,
  (ba.id IS NOT NULL) AS has_billing_account
FROM "Tenant" t
LEFT JOIN "TenantMember" tm ON tm."tenantId" = t.id
LEFT JOIN "User" u ON u.id = tm."userId"
LEFT JOIN "Subscription" s ON s."tenantId" = t.id
LEFT JOIN "Plan" p ON p.id = s."planId"
LEFT JOIN "BillingAccount" ba ON ba.id = t."billingAccountId"
WHERE t.slug = 'ccpf-system-owner'
ORDER BY s."createdAt" DESC NULLS LAST;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "User" WHERE email = 'paulo@test.com'
  ) THEN
    RAISE EXCEPTION 'Seed incompleto: administrador paulo@test.com ausente.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "Tenant" t
    JOIN "TenantMember" tm ON tm."tenantId" = t.id
    JOIN "User" u ON u.id = tm."userId"
    JOIN "BillingAccount" ba ON ba.id = t."billingAccountId"
    JOIN "Subscription" s ON s."tenantId" = t.id
    JOIN "Plan" p ON p.id = s."planId"
    WHERE t.slug = 'ccpf-system-owner'
      AND u.email = 'paulo@test.com'
      AND tm.role = 'OWNER'
      AND ba."ownerUserId" = u.id
      AND s."billingAccountId" = ba.id
      AND p.code = 'SYSTEM_OWNER'
      AND s.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Seed incompleto: SYSTEM_OWNER, proprietário ou BillingAccount inválidos.';
  END IF;
END $$;
SQL

echo
echo "========== 7. VERIFICANDO CATEGORIAS =========="
"${DC[@]}" exec -T postgres psql -U postgres -d ccpf \
  -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
SELECT t.name AS tenant, COUNT(DISTINCT c.id) AS categories
FROM "Tenant" t
LEFT JOIN "Category" c ON c."tenantId" = t.id
WHERE t.slug = 'ccpf-system-owner'
GROUP BY t.id, t.name;
SQL

echo
echo "========== 8. VERIFICANDO PLANOS =========="
"${DC[@]}" exec -T postgres psql -U postgres -d ccpf \
  -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
SELECT code, name FROM "Plan" ORDER BY code;
SQL

echo
echo "========== 9. INICIANDO API E FRONTEND =========="
"${DC[@]}" up -d api web mailpit

echo
echo "RESET, MIGRATIONS E SEEDS CONCLUÍDOS."
