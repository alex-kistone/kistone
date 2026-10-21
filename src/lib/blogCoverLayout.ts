/**
 * Mise en page de la carte « Design Card Blog » v3 (skill design-card-blog), partagée par la
 * couverture dessinée en image (blogCover.ts) et celle dessinée dans la page (PostCard) : cotes à
 * 1200 × 800. Le titre est centré, sur une ligne ou deux lignes équilibrées ; l'éclair en
 * filigrane part de 69 % de la largeur et se décale jusqu'à 74 % pour ne jamais toucher le titre ;
 * au-delà, le titre rapetisse.
 */

const W = 1200;
const H = 800;
const MAX_TEXT = W * 0.76; // marges latérales de 12 %
const BOLT_MIN = W * 0.69;
const BOLT_MAX = W * 0.74;
const BOLT_GAP = 24;

/** Éclair Kistone plein (viewBox 624 × 1024), à remplir en « evenodd ». */
export const BOLT_FILLED_PATH = "M154 982C170 962 195 932 208 916C239 879 306 797 316 785C320 779 333 763 346 748C358 734 386 699 409 672C431 644 453 617 458 611C468 599 504 555 523 532C531 522 543 507 551 498C558 490 568 477 574 470C594 446 601 437 601 436C601 435 601 435 600 436C599 436 590 441 580 446C538 470 548 460 490 531C479 544 464 563 455 574C417 620 396 645 388 654C384 660 364 685 344 709C310 750 274 794 241 836C219 862 209 874 208 874C208 873 219 845 233 811C305 631 319 595 319 594C318 594 316 595 314 596C311 598 304 602 297 605L284 612L279 625C276 632 271 644 268 652C264 661 260 672 257 678C255 683 236 732 214 787C150 947 121 1018 121 1021L120 1024L122 1021C123 1019 138 1002 154 982ZM271 597L284 596L298 589C305 584 321 576 332 569C343 563 358 555 364 551C371 547 390 537 406 527C423 518 445 506 455 500C485 483 544 450 584 428C604 417 621 407 622 407C624 404 600 404 470 404L345 404L329 413C320 418 306 426 296 432C286 437 268 447 255 455C242 462 214 477 194 489C173 501 140 519 121 530C102 540 67 560 44 573L2 596L7 597C15 598 257 598 271 597ZM141 571L102 570L108 567C116 563 127 556 140 549C163 536 192 520 223 503C322 447 347 433 353 432C361 431 516 431 519 432C522 433 524 432 490 451C475 459 453 471 442 478C430 484 414 493 406 497C387 508 355 526 311 551L274 572L227 572C201 572 162 571 141 571ZM31 564C31 564 43 557 58 549C86 532 85 533 96 520C104 511 221 370 249 336C256 328 276 303 293 282C310 262 329 238 335 231C378 179 411 140 409 145C407 151 397 176 360 271C315 387 309 403 309 405C309 407 310 406 319 402C331 396 344 387 344 386C344 384 350 370 397 248C405 229 417 197 425 177C433 157 443 130 448 118C453 106 462 82 468 66C475 50 483 29 487 19C490 10 493 2 493 2C493 1 475 22 454 48C432 74 387 129 352 170C318 212 273 265 253 290C210 342 184 374 137 430C118 453 97 479 90 488C83 496 68 515 57 528C30 560 27 564 27 564C27 565 30 565 31 564Z";

export type CoverLayout = { size: number; lines: string[]; top: number; barY: number; boltLeft: number };

/** Coupe en deux lignes de largeurs aussi proches que possible (text-wrap: balance). */
function balanced(words: string[], width: (s: string) => number): string[] {
  let best = [words.join(" ")];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const w = Math.max(...pair.map(width));
    if (w < bestW) { best = pair; bestW = w; }
  }
  return best;
}

/**
 * Taille, lignes et positions du titre, de la barre et de l'éclair. `measure(texte, taille)` rend
 * la largeur en pixels du texte en Outfit 700 (canvas) ou une estimation (rendu serveur).
 */
export function coverLayout(title: string, measure: (text: string, size: number) => number): CoverLayout {
  const words = title.trim().split(/\s+/);
  const short = words.length <= 2 && title.trim().length <= 10;
  for (let size = short ? 170 : 130; size >= 72; size -= 2) {
    const width = (s: string) => measure(s, size);
    // Une ligne si elle tient (titre et éclair), sinon deux lignes équilibrées, à cette taille
    const options = words.length < 2 ? [[title.trim()]] : [[title.trim()], balanced(words, width)];
    for (const lines of options) {
      const widest = Math.max(...lines.map(width));
      const needed = W / 2 + widest / 2 + BOLT_GAP;
      if (widest <= MAX_TEXT && needed <= BOLT_MAX) {
        const block = lines.length * size + 32 + 6;
        const blockTop = (H - block) / 2;
        return { size, lines, top: blockTop + size / 2, barY: blockTop + lines.length * size + 32, boltLeft: Math.max(BOLT_MIN, needed) };
      }
    }
  }
  const size = 72;
  const blockTop = (H - (size + 38)) / 2;
  return { size, lines: [title.trim()], top: blockTop + size / 2, barY: blockTop + size + 32, boltLeft: BOLT_MAX };
}

/** Estimation de la largeur d'un texte en Outfit 700 (interlettrage -0,045 em), sans canvas. */
export const estimateOutfitWidth = (text: string, size: number) => text.length * size * 0.47;
