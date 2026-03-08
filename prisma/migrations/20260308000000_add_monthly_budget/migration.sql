CREATE TABLE "monthly_budget" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "budget_limit" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_budget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_budget_user_id_month_key" ON "monthly_budget"("user_id", "month");
CREATE INDEX "monthly_budget_user_id_month_idx" ON "monthly_budget"("user_id", "month");

ALTER TABLE "monthly_budget" ADD CONSTRAINT "monthly_budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
