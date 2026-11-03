import { describe, expect, it } from "vitest";
import { isAllowedTeacher, readBearerToken } from "./teacher";

describe("readBearerToken", () => {
  it("Bearer 머리글에서 토큰을 꺼냅니다", () => {
    expect(readBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(readBearerToken("bearer abc")).toBe("abc");
  });

  it("머리글이 없거나 형식이 다르면 null입니다", () => {
    expect(readBearerToken(null)).toBeNull();
    expect(readBearerToken("")).toBeNull();
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken("Bearer")).toBeNull();
  });
});

describe("isAllowedTeacher", () => {
  const allowed = "teacher@example.com";

  it("허용 이메일과 같으면 교사입니다 (대소문자·공백 무시)", () => {
    expect(isAllowedTeacher({ email: "teacher@example.com", email_verified: true }, allowed)).toBe(true);
    expect(isAllowedTeacher({ email: "Teacher@Example.com", email_verified: true }, ` ${allowed} `)).toBe(true);
  });

  it("다른 이메일은 교사가 아닙니다", () => {
    expect(isAllowedTeacher({ email: "student@example.com", email_verified: true }, allowed)).toBe(false);
  });

  it("확인되지 않은 이메일이나 이메일 없음은 교사가 아닙니다", () => {
    expect(isAllowedTeacher({ email: allowed, email_verified: false }, allowed)).toBe(false);
    expect(isAllowedTeacher({ email: allowed }, allowed)).toBe(false);
    expect(isAllowedTeacher({ email_verified: true }, allowed)).toBe(false);
  });

  it("허용 이메일 설정이 없으면 아무도 교사가 아닙니다", () => {
    expect(isAllowedTeacher({ email: allowed, email_verified: true }, undefined)).toBe(false);
    expect(isAllowedTeacher({ email: allowed, email_verified: true }, "")).toBe(false);
  });
});
