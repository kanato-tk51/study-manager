import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30");

export { JWT_SECRET, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_DAYS };
