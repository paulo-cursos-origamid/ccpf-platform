/*
  Garante que um Tenant possua no máximo uma Subscription corrente.

  Estados considerados correntes:
  - PENDING
  - TRIALING
  - ACTIVE
  - PAST_DUE
  - SUSPENDED

  Estados terminais não participam da restrição:
  - CANCELLED
  - EXPIRED
*/

CREATE UNIQUE INDEX "Subscription_current_tenantId_unique"
ON "Subscription" ("tenantId")
WHERE "status" IN (
  'PENDING',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED'
);
