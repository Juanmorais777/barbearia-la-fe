import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const users = [
  {
    email: "daniel@barbearialafe.com",
    password: "Daniel@LaFe2026",
  },
  {
    email: "danrley@barbearialafe.com",
    password: "Danrley@LaFe2026",
  },
  {
    email: "jose@barbearialafe.com",
    password: "Jose@LaFe2026",
  },
];

try {
  for (const user of users) {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          role,
          barber_id,
          active,
          password_hash
        FROM admins
        WHERE LOWER(email) = LOWER($1)
      `,
      [user.email],
    );

    if (result.rows.length === 0) {
      console.log(`❌ NÃO ENCONTRADO: ${user.email}`);
      continue;
    }

    const admin = result.rows[0];

    const passwordOk = await bcrypt.compare(
      user.password,
      admin.password_hash,
    );

    console.log(`👤 ${admin.name}`);
    console.log(`   E-mail: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Barber ID: ${admin.barber_id}`);
    console.log(`   Active: ${admin.active}`);
    console.log(`   Senha confere: ${passwordOk ? "✅ SIM" : "❌ NÃO"}`);
    console.log("");
  }
} catch (error) {
  console.error("❌ ERRO:", error);
} finally {
  await pool.end();
}