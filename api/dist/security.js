import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export function randomToken(bytes = 32) {
    return randomBytes(bytes).toString("base64url");
}
export function hashToken(value) {
    return createHash("sha256").update(value).digest("hex");
}
export function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length)
        return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
}
export function normaliseAdminToken(value) {
    return value.trim();
}
