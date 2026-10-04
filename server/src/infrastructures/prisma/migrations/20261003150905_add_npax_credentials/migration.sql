-- CreateTable
CREATE TABLE "npax_credentials" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "user_id" TEXT NOT NULL,
    "password_encrypted" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "npax_credentials_pkey" PRIMARY KEY ("id")
);
