// Datos de ejemplo para desarrollo. Ejecutar con: npm run db:seed
// Es idempotente: borra y recrea los datos de ejemplo cada vez.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Fechas en hora de Ecuador (UTC-5).
const ec = (s: string) => new Date(`${s}-05:00`);

async function main() {
  // Orden de borrado: primero lo que depende de otras tablas (FKs).
  await prisma.checkIn.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.priceTier.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: { name: "Demo Producciones", slug: "demo-producciones" },
  });

  const venue = await prisma.venue.create({
    data: {
      organizationId: org.id,
      name: "Discoteca La Central",
      address: "Av. Amazonas y Naciones Unidas",
      city: "Quito",
    },
  });

  await prisma.event.create({
    data: {
      organizationId: org.id,
      venueId: venue.id,
      name: "Noche de Verano",
      slug: "noche-de-verano",
      description:
        "La fiesta del año: DJs invitados, dos pistas y terraza al aire libre. Solo mayores de 18 años.",
      startsAt: ec("2026-08-08T22:00:00"),
      endsAt: ec("2026-08-09T04:00:00"),
      status: "PUBLISHED",
      ticketTypes: {
        create: [
          {
            name: "General",
            description: "Acceso a todas las pistas.",
            totalStock: 400,
            sortOrder: 1,
            priceTiers: {
              create: [
                {
                  name: "Early bird",
                  priceCents: 1000,
                  endsAt: ec("2026-08-01T00:00:00"),
                },
                {
                  name: "Tanda 2",
                  priceCents: 1500,
                  startsAt: ec("2026-08-01T00:00:00"),
                },
              ],
            },
          },
          {
            name: "VIP",
            description: "Zona exclusiva con barra propia y mesas.",
            totalStock: 80,
            sortOrder: 2,
            priceTiers: {
              create: [{ name: "Único", priceCents: 3000 }],
            },
          },
          {
            name: "Combo 4 amigos",
            description: "4 entradas generales a precio de 3.2 — vienen juntos, entran juntos.",
            groupSize: 4,
            totalStock: 25,
            sortOrder: 3,
            priceTiers: {
              create: [{ name: "Único", priceCents: 3200 }],
            },
          },
        ],
      },
    },
  });

  // Cuentas de prueba para el login de staff (Fase 3, escaneo en la
  // puerta). Contraseñas de desarrollo, nunca usar estas en producción.
  const STAFF_PASSWORD = "Portero123!";
  const ORGANIZER_PASSWORD = "Organizador123!";
  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Felipe (organizador)",
      email: "felipe@demo-producciones.test",
      passwordHash: await hashPassword(ORGANIZER_PASSWORD),
      role: "ORGANIZER",
    },
  });
  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Portero Demo",
      email: "portero@demo-producciones.test",
      passwordHash: await hashPassword(STAFF_PASSWORD),
      role: "STAFF",
    },
  });

  console.log("Seed OK: evento 'Noche de Verano' con 3 tipos de entrada.");
  console.log("");
  console.log("Cuentas de prueba para /login:");
  console.log(
    `  Organizador -> felipe@demo-producciones.test / ${ORGANIZER_PASSWORD}`,
  );
  console.log(
    `  Staff       -> portero@demo-producciones.test / ${STAFF_PASSWORD}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
