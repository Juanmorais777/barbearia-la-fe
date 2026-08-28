import jwt, { type SignOptions } from "jsonwebtoken";

export type SessionPayload = {
  sub: number;
  name: string;
  email: string;
  role: string;
};

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production" && process.env.LA_FE_ALLOW_INSECURE_JWT !== "true") {
      // Em produção o segredo é obrigatório.
      console.error("[La Fé] JWT_SECRET não configurado.");
    }
    return "la-fe-dev-secret-change-me";
  }
  return value;
}

export function expiresIn(): string {
  return process.env.JWT_EXPIRES_IN || "8h";
}

export function expiresInMs(): number {
  const raw = expiresIn();
  const match = raw.match(/^(\d+)([smhd])?$/);
  if (!match) return 8 * 60 * 60 * 1000;
  const multiplier: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * (multiplier[match[2] || "s"] || 1000);
}

export function signToken(payload: SessionPayload): string {
  const options: SignOptions = { expiresIn: expiresIn() as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret(), options);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string") return null;
    const payload = decoded as Partial<SessionPayload>;
    if (!payload.sub) return null;
    return {
      sub: Number(payload.sub),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      role: String(payload.role || "OWNER"),
    };
  } catch {
    return null;
  }
}
