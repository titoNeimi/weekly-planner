import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const url = process.env.DATABASE_URL!;
const prisma =
  url.startsWith("prisma://") || url.startsWith("prisma+postgres://")
    ? new PrismaClient({ accelerateUrl: url })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (error) {
    console.error("Failed to fetch users:", error.message);
    process.exit(1);
  }

  for (const user of data.users) {
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: user.user_metadata?.full_name ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
    });
    console.log(`upserted profile for ${user.email}`);
  }

  console.log(`done — ${data.users.length} users processed`);
}

main().finally(() => prisma.$disconnect());
