// Crea la primera Organización + la primera cuenta de organizador en una
// base de datos vacía (típicamente producción, recién desplegada — el
// seed.ts de datos de ejemplo NO corre ahí).
//
// Uso:
//   DATABASE_URL="postgres://..." npx tsx prisma/create-first-organizer.ts \
//     "Nombre de tu negocio" "Tu nombre" "tu@email.com"
//
// Es seguro correrlo una sola vez: si ya existe una organización, no hace
// nada y te avisa (para no crear duplicados por error).
import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "organizacion"
  );
}

const SAFE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function generatePassword(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

async function main() {
  const [orgName, adminName, adminEmail] = process.argv.slice(2);
  if (!orgName || !adminName || !adminEmail) {
    console.error(
      'Uso: npx tsx prisma/create-first-organizer.ts "Nombre del negocio" "Tu nombre" "tu@email.com"',
    );
    process.exit(1);
  }

  const existing = await prisma.organization.findFirst();
  if (existing) {
    console.error(
      `Ya existe una organización ("${existing.name}") — no se creó nada nuevo. Si quieres agregar otra cuenta de organizador, hazlo desde /admin en vez de este script.`,
    );
    process.exit(1);
  }

  const password = generatePassword();
  const org = await prisma.organization.create({
    data: { name: orgName, slug: await uniqueSlug(orgName) },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 10),
      role: "ORGANIZER",
    },
  });

  console.log(`Organización creada: ${org.name}`);
  console.log("");
  console.log("Cuenta de organizador:");
  console.log(`  Email:      ${adminEmail}`);
  console.log(`  Contraseña: ${password}`);
  console.log("");
  console.log(
    "Guárdala ahora — no se vuelve a mostrar. Entra en /login y crea tu primer evento desde /admin.",
  );
}

async function uniqueSlug(name: string): Promise<string> {
  const root = slugify(name);
  let candidate = root;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
