export const random = (min, max) => Math.random() * (max - min) + min;
export const randomInt = (min, max) => Math.floor(random(min, max + 1));
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
export const randomSign = () => (Math.random() < 0.5 ? -1 : 1);
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;

export function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
