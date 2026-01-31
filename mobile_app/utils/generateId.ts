/**
 * Simple ID generator that works in React Native without crypto polyfills.
 * Generates a unique ID using timestamp + random string.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
}
