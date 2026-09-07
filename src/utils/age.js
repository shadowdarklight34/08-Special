/** Live age ticker — time lived since `birthDate`. Returns a stop() function. */
export function startAgeTicker(el, birthDate) {
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) { el.textContent = ''; return () => {}; }

  const pad = (n) => String(n).padStart(2, '0');
  const render = () => {
    const now = new Date();
    let years = now.getFullYear() - born.getFullYear();
    let anniversary = new Date(born); anniversary.setFullYear(born.getFullYear() + years);
    if (anniversary > now) { years -= 1; anniversary.setFullYear(born.getFullYear() + years); }
    const ms = Math.max(0, now - anniversary);
    const days = Math.floor(ms / 86_400_000);
    const rest = ms - days * 86_400_000;
    const h = Math.floor(rest / 3_600_000), m = Math.floor((rest % 3_600_000) / 60_000), s = Math.floor((rest % 60_000) / 1000);
    el.textContent = `${years}Y · ${days}D · ${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  render();
  const id = setInterval(render, 1000);
  return () => clearInterval(id);
}
