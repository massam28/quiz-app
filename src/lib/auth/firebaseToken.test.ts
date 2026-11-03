import { describe, expect, it } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyFirebaseIdToken } from "./firebaseToken";

// 실제 Google 키 대신 점검용 키로 만든 토큰으로 확인합니다.
const PROJECT = "test-project";

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const keys = createLocalJWKSet({ keys: [jwk] });
  const now = Math.floor(Date.now() / 1000);
  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: number } = {}) =>
    new SignJWT({ auth_time: now - 10, email: "t@example.com", email_verified: true, ...claims })
      .setProtectedHeader({ alg: "RS256", kid: "k1" })
      .setIssuer(opts.iss ?? `https://securetoken.google.com/${PROJECT}`)
      .setAudience(opts.aud ?? PROJECT)
      .setSubject("uid-1")
      .setIssuedAt(now - 10)
      .setExpirationTime(opts.exp ?? now + 3600)
      .sign(privateKey);
  return { keys, sign, now };
}

describe("verifyFirebaseIdToken", () => {
  it("올바른 토큰이면 이메일 정보를 돌려줍니다", async () => {
    const { keys, sign } = await setup();
    const claims = await verifyFirebaseIdToken(await sign({}), PROJECT, keys);
    expect(claims).toEqual({ sub: "uid-1", email: "t@example.com", email_verified: true });
  });

  it("다른 프로젝트용 토큰은 거부합니다", async () => {
    const { keys, sign } = await setup();
    await expect(verifyFirebaseIdToken(await sign({}, { aud: "other" }), PROJECT, keys)).rejects.toThrow();
    await expect(
      verifyFirebaseIdToken(await sign({}, { iss: "https://securetoken.google.com/other" }), PROJECT, keys),
    ).rejects.toThrow();
  });

  it("만료된 토큰은 거부합니다", async () => {
    const { keys, sign, now } = await setup();
    await expect(verifyFirebaseIdToken(await sign({}, { exp: now - 60 }), PROJECT, keys)).rejects.toThrow();
  });

  it("다른 키로 서명한 토큰은 거부합니다", async () => {
    const { keys } = await setup();
    const other = await setup();
    await expect(verifyFirebaseIdToken(await other.sign({}), PROJECT, keys)).rejects.toThrow();
  });

  it("로그인 시각(auth_time)이 없으면 거부합니다", async () => {
    const { keys, sign } = await setup();
    await expect(verifyFirebaseIdToken(await sign({ auth_time: undefined }), PROJECT, keys)).rejects.toThrow();
  });
});
