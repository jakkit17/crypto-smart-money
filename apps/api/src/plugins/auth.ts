import type { FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getUserByAuthUserId } from "db";

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured");
}

const supabaseJWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
);

export type AuthenticatedUser = {
  authUserId: string;
  userId: string;
};

async function authenticate(
  request: FastifyRequest,
): Promise<AuthenticatedUser> {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing authorization token");
  }

  const token = authorization.slice("Bearer ".length);

  const { payload } = await jwtVerify(
    token,
    supabaseJWKS,
    {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: "authenticated",
    },
  );

  if (!payload.sub) {
    throw new Error("Invalid authentication token");
  }

  const user = await getUserByAuthUserId(payload.sub);

  if (!user) {
    throw new Error("Local user not found");
  }

  return {
    authUserId: payload.sub,
    userId: user.id,
  };
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | undefined;
  }

  interface FastifyInstance {
    authenticate(
      request: FastifyRequest,
    ): Promise<void>;
  }
}

export default fp(async (app) => {
  app.decorateRequest("user");

  app.decorate(
    "authenticate",
    async (request: FastifyRequest) => {
      request.user = await authenticate(request);
    },
  );
});