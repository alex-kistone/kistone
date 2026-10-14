/**
 * Le texte des posts LinkedIn suit le format « little text » : certains caractères doivent
 * être échappés, et les hashtags s'écrivent {hashtag|\#|mot}.
 */
export function toLittleText(text: string): string {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/u);
  return parts.map((p) => {
    if (/^#[\p{L}\p{N}_]+$/u.test(p)) return `{hashtag|\\#|${p.slice(1)}}`;
    return p.replace(/[\\|{}@\[\]()<>#*_~]/g, (c) => `\\${c}`);
  }).join("");
}
