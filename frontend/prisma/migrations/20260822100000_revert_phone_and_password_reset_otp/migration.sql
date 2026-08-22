-- DropForeignKey
ALTER TABLE "PasswordResetOtp" DROP CONSTRAINT "PasswordResetOtp_userId_fkey";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone";

-- DropTable
DROP TABLE "PasswordResetOtp";
