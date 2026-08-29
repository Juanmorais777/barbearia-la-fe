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
    const hash = await bcrypt.hash(user.password, 10);

    const result = await pool.query(
      `
        UPDATE admins
        SET password_hash = $1,
            active = 1
        WHERE LOWER(email) = LOWER($2)
        RETURNING id, name, email, role, barber_id, active
      `,
      [hash, user.email],
    );

    if (result.rows.length === 0) {
      console.log(`❌ Usuário não encontrado: ${user.email}`);
    } else {
      const admin = result.rows[0];

      console.log(`✅ Senha resetada: ${admin.name}`);
      console.log(`   E-mail: ${admin.email}`);
      console.log(`   Senha: ${user.password}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Barber ID: ${admin.barber_id}`);
      console.log("");
    }
  }
} catch (error) {
  console.error("❌ Erro:", error);
} finally {
  await pool.end();
}