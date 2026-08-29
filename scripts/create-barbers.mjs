import bcrypt from "bcryptjs";
import { db } from "../src/lib/database/connection.ts";

const barbers = [
  {
    name: "Daniel",
    email: "daniel@barbearialafe.com",
    password: "DanielLaFe@2026",
    barber_id: 5,
  },
  {
    name: "Danrley",
    email: "danrley@barbearialafe.com",
    password: "DanrleyLaFe@2026",
    barber_id: 6,
  },
  {
    name: "Jose",
    email: "jose@barbearialafe.com",
    password: "JoseLaFe@2026",
    barber_id: 7,
  },
];

for (const barber of barbers) {
  const existing = await db.first(
    "SELECT id FROM admins WHERE email = @email",
    { email: barber.email.toLowerCase() },
  );

  if (existing) {
    console.log(`Já existe: ${barber.email}`);
    continue;
  }

  const password_hash = await bcrypt.hash(
    barber.password,
    10,
  );

  const id = await db.insert("admins", {
    name: barber.name,
    email: barber.email.toLowerCase(),
    password_hash,
    role: "BARBER",
    barber_id: barber.barber_id,
    active: 1,
  });

  console.log(
    `Criado: ${barber.name} | ID: ${id}`,
  );
}

process.exit(0);

