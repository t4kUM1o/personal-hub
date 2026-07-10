// 初回セットアップ用: 環境変数からただ1人の管理者アカウントを作成する。
// 公開の会員登録フォームは意図的に用意していないため、ユーザーを増やす唯一の入口。
// 実行方法: docker compose run --rm migrate node prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD が .env に設定されていません。"
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`既にユーザーが存在します: ${email} (role: ${existing.role})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "ADMIN" },
  });

  console.log(`管理者ユーザーを作成しました: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
