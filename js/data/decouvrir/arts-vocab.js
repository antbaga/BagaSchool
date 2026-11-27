// Histoire des arts : vocabulaire par niveau, schémas SVG originaux (dessinés pour BagaSchool, libres),
// et zones de composition de quelques tableaux très connus (rectangles en % de l'image, volontairement larges).

const svg = (inner) => `<svg viewBox="0 0 120 90" aria-hidden="true">${inner}</svg>`;
const cadre = (inner, fond = "#fff8e8") => `<rect x="6" y="4" width="108" height="82" rx="3" fill="${fond}" stroke="#b78b4a" stroke-width="4"/>${inner}`;
const mailles = (x0, y0, motif, cols, t = 7) => motif.map((ligne, j) => [...ligne].map((ch, i) => ch === "." ? "" : `<rect x="${x0 + i * t}" y="${y0 + j * t}" width="${t - 1}" height="${t - 1}" fill="${cols[ch]}"/>`).join("")).join("");
const paysageBase = (h) => {
  const o = (k) => (h && h !== k ? ' opacity=".28"' : "");
  const hl = (k) => (h === k ? ' stroke="#e0556a" stroke-width="2.5" stroke-dasharray="4 3"' : "");
  return `<rect x="6" y="4" width="108" height="82" rx="3" fill="#dff1ff"/>
    <path d="M6 50 L30 26 L46 40 L64 18 L86 40 L100 30 L114 44 L114 56 L6 56Z" fill="#a9b8de"${o("ap")}${hl("ap")}/>
    <path d="M6 58 Q40 46 70 56 T114 54 L114 86 L6 86Z" fill="#9fd48a"${o("mp")}/>
    <g${o("pp")}><rect x="22" y="44" width="7" height="40" fill="#8a5a2b"${hl("pp")}/><circle cx="25" cy="38" r="17" fill="#4fae5c"${hl("pp")}/></g>
    <g${o("mp")}><rect x="78" y="48" width="3" height="10" fill="#8a5a2b"/><circle cx="79.5" cy="45" r="6" fill="#4fae5c"/><rect x="60" y="50" width="12" height="9" fill="#fff"/><path d="M58 51 L66 44 L74 51Z" fill="#e0556a"/></g>`;
};

export const SCHEMAS = {
  portrait: svg(cadre(`<path d="M44 34 q16 -26 32 0 q2 10 -2 16 h-28 q-4 -6 -2 -16z" fill="#6b4a2b"/><ellipse cx="60" cy="40" rx="13" ry="15" fill="#f2c9a0"/><circle cx="55" cy="38" r="1.8" fill="#3b3355"/><circle cx="65" cy="38" r="1.8" fill="#3b3355"/><path d="M55 47 q5 4 10 0" stroke="#3b3355" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M32 86 q0 -28 28 -28 q28 0 28 28z" fill="#7a6cf0"/>`)),
  autoportrait: svg(`<rect x="62" y="6" width="52" height="66" rx="3" fill="#fff8e8" stroke="#b78b4a" stroke-width="3"/><ellipse cx="88" cy="32" rx="9" ry="11" fill="#f2c9a0"/><path d="M72 72 q0 -22 16 -22 q16 0 16 22z" fill="#ff8fab"/><path d="M60 72 L74 88 M114 72 L100 88" stroke="#8a5a2b" stroke-width="3"/>
    <ellipse cx="30" cy="34" rx="11" ry="13" fill="#f2c9a0"/><path d="M19 30 q11 -16 22 0" fill="#6b4a2b"/><path d="M8 88 q0 -32 22 -32 q22 0 22 32z" fill="#ff8fab"/><path d="M46 62 L60 44" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><circle cx="60.5" cy="43" r="2.5" fill="#e0556a"/>`),
  paysage: svg(`<rect x="6" y="4" width="108" height="82" rx="3" fill="#cfeaff"/><circle cx="92" cy="20" r="9" fill="#ffd34d"/><path d="M6 60 Q36 30 66 58 T114 52 L114 86 L6 86Z" fill="#8fcf7a"/><path d="M6 70 Q50 56 114 72 L114 86 L6 86Z" fill="#6fb85f"/><rect x="28" y="52" width="4" height="14" fill="#8a5a2b"/><circle cx="30" cy="48" r="9" fill="#3f9a4e"/><path d="M60 86 Q66 72 80 66" stroke="#7fb6e6" stroke-width="5" fill="none"/>`),
  "nature-morte": svg(cadre(`<rect x="6" y="62" width="108" height="24" fill="#c99a63"/><path d="M78 30 q-8 16 0 34 h14 q8 -18 0 -34z" fill="#7fb6e6"/><path d="M85 30 V14 M85 18 l-8 -6 M85 16 l7 -7" stroke="#3f9a4e" stroke-width="2"/><circle cx="77" cy="12" r="4" fill="#ff8fab"/><circle cx="92" cy="9" r="4" fill="#ffd34d"/><path d="M22 52 h40 q-2 14 -20 14 q-18 0 -20 -14z" fill="#fff" stroke="#b9b0d0"/><circle cx="34" cy="48" r="7" fill="#e0556a"/><circle cx="46" cy="47" r="7" fill="#7cc35a"/><circle cx="40" cy="41" r="6" fill="#f39a2b"/>`)),
  chaudes: svg(`<circle cx="26" cy="30" r="15" fill="#e8473c"/><circle cx="60" cy="30" r="15" fill="#f39a2b"/><circle cx="94" cy="30" r="15" fill="#f7d13d"/><path d="M60 86 c-18 -4 -20 -22 -8 -34 c0 8 4 10 6 10 c-2 -10 4 -18 10 -22 c-2 10 12 16 10 30 c-1 9 -8 15 -18 16z" fill="#f39a2b"/><path d="M60 86 c-8 -2 -9 -10 -4 -16 c1 4 4 5 5 4 c0 -4 2 -7 5 -9 c0 6 5 9 4 14 c-1 4 -5 7 -10 7z" fill="#f7d13d"/>`),
  froides: svg(`<circle cx="26" cy="30" r="15" fill="#3a7bd5"/><circle cx="60" cy="30" r="15" fill="#3bb08f"/><circle cx="94" cy="30" r="15" fill="#8a5cc9"/><path d="M60 52 q14 18 14 24 a14 14 0 0 1 -28 0 q0 -6 14 -24z" fill="#7fc4ef"/><path d="M54 74 a7 7 0 0 0 6 7" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  "premier-plan": svg(paysageBase("pp")),
  "arriere-plan": svg(paysageBase("ap")),
  sculpture: svg(`<rect x="38" y="70" width="44" height="14" rx="2" fill="#d8d2e6"/><rect x="44" y="64" width="32" height="7" fill="#c5bdd9"/><circle cx="60" cy="18" r="8" fill="#b9b1cc"/><path d="M50 30 q10 -6 20 0 l4 18 h-6 l-2 16 h-12 l-2 -16 h-6z" fill="#b9b1cc"/><path d="M70 32 l10 -10" stroke="#b9b1cc" stroke-width="5" stroke-linecap="round"/><path d="M20 40 q-6 -6 0 -12 M100 40 q6 -6 0 -12" stroke="#8a829c" stroke-width="2" fill="none"/>`),
  parietal: svg(`<path d="M4 10 Q30 2 60 8 T116 6 L114 84 Q80 90 50 84 T6 86Z" fill="#e8d2ad"/><path d="M18 20 q20 -8 30 2 M70 70 q20 6 36 -4" stroke="#d6bb8e" stroke-width="2" fill="none"/>
    <path d="M30 50 q4 -14 22 -14 q14 -2 26 2 q8 -6 12 -2 q-2 4 -6 6 q4 10 -2 14 l2 14 h-4 l-3 -12 q-12 4 -26 0 l-3 12 h-4 l0 -14 q-10 -2 -14 -6z" fill="#9b3d1f"/><path d="M86 38 q4 -6 2 -10 M90 40 q6 -4 6 -9" stroke="#3b2a1a" stroke-width="2" fill="none"/>
    <g fill="#c0603a" opacity=".85"><ellipse cx="100" cy="66" rx="7" ry="8"/><rect x="92" y="50" width="3" height="12" rx="1.5"/><rect x="96" y="47" width="3" height="14" rx="1.5"/><rect x="100" y="47" width="3" height="14" rx="1.5"/><rect x="104" y="50" width="3" height="12" rx="1.5"/><rect x="88" y="62" width="8" height="3" rx="1.5" transform="rotate(-30 92 63)"/></g>`),
  horizon: svg(`<rect x="6" y="4" width="108" height="44" fill="#ffe2c4"/><rect x="6" y="48" width="108" height="38" fill="#7fb6e6"/><circle cx="70" cy="48" r="12" fill="#f39a2b"/><rect x="6" y="48" width="108" height="38" fill="#7fb6e6" opacity=".9"/><path d="M60 54 h20 M64 60 h12" stroke="#f39a2b" stroke-width="2"/><path d="M24 62 h22 l-4 6 h-14z" fill="#3b3355"/><path d="M35 62 V48 l8 10z" fill="#fff"/><line x1="2" y1="48" x2="118" y2="48" stroke="#e0556a" stroke-width="2.5" stroke-dasharray="5 3"/>`),
  primaires: svg(`<circle cx="22" cy="42" r="16" fill="#e8473c"/><circle cx="60" cy="42" r="16" fill="#f7d13d"/><circle cx="98" cy="42" r="16" fill="#2f6fd0"/><text x="22" y="76" font-size="10" text-anchor="middle" fill="#3b3355" font-weight="800">rouge</text><text x="60" y="76" font-size="10" text-anchor="middle" fill="#3b3355" font-weight="800">jaune</text><text x="98" y="76" font-size="10" text-anchor="middle" fill="#3b3355" font-weight="800">bleu</text>`),
  mosaique: svg(`<rect x="10" y="8" width="100" height="74" rx="3" fill="#efe6d4"/>` + mailles(18, 12, ["..........ww", "...ooo...ww.", "..ooooo.ww..", ".ookoooooo..", "..ooooo.ww..", "...ooo...ww.", "..........ww", "bbbbbbbbbbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb"], { o: "#f39a2b", k: "#3b3355", w: "#e0556a", b: "#5fa8e0" })),
  colonne: svg(`<rect x="36" y="6" width="48" height="8" fill="#d8d2e6"/><rect x="40" y="14" width="40" height="5" fill="#c5bdd9"/><path d="M42 19 h36 l-4 6 h-28z" fill="#d8d2e6"/><rect x="47" y="25" width="26" height="52" fill="#ece8f4"/><path d="M52 25 V77 M57 25 V77 M62 25 V77 M67 25 V77" stroke="#c5bdd9" stroke-width="1.5"/><rect x="42" y="77" width="36" height="5" fill="#c5bdd9"/><rect x="38" y="82" width="44" height="5" fill="#d8d2e6"/>`),
  architecture: svg(`<path d="M20 40 L60 14 L100 40Z" fill="#e0556a"/><rect x="26" y="40" width="68" height="44" fill="#fff4dc" stroke="#b78b4a" stroke-width="2"/><rect x="34" y="48" width="12" height="12" fill="#7fb6e6"/><rect x="74" y="48" width="12" height="12" fill="#7fb6e6"/><rect x="53" y="60" width="14" height="24" fill="#8a5a2b"/><path d="M98 86 L114 54 L114 86Z" fill="none" stroke="#7a6cf0" stroke-width="2.5"/><path d="M104 86 v-4 M108 86 v-6 M112 86 v-4" stroke="#7a6cf0" stroke-width="1.5"/>`),
  fresque: svg(`<rect x="6" y="6" width="108" height="80" fill="#ead9c2"/><path d="M6 20 h108 M6 36 h108 M6 52 h108 M6 68 h108" stroke="#dcc6a7" stroke-width="1"/><rect x="18" y="14" width="66" height="50" fill="#f6ead6" stroke="#c99a63" stroke-dasharray="3 2"/><circle cx="38" cy="32" r="8" fill="#f39a2b"/><path d="M48 52 q10 -16 24 -8 q-6 4 -10 10z" fill="#3a7bd5"/><path d="M18 64 q30 -10 66 0" stroke="#7cc35a" stroke-width="5" fill="none"/><path d="M92 60 L106 28" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/><path d="M90 66 L93 58 L97 60 Z" fill="#3a7bd5"/><rect x="90" y="70" width="18" height="14" rx="2" fill="#b9b0d0"/>`),
  roman: svg(`<rect x="10" y="40" width="70" height="44" fill="#e8dcc4" stroke="#a8916a" stroke-width="2"/><path d="M6 42 L45 22 L84 42Z" fill="#c0603a"/><rect x="84" y="24" width="26" height="60" fill="#e8dcc4" stroke="#a8916a" stroke-width="2"/><path d="M82 26 L97 10 L112 26Z" fill="#c0603a"/><path d="M37 84 V64 a8 8 0 0 1 16 0 V84Z" fill="#8a5a2b"/><path d="M19 62 V54 a3.5 3.5 0 0 1 7 0 V62Z M64 62 V54 a3.5 3.5 0 0 1 7 0 V62Z M93 46 V38 a4 4 0 0 1 8 0 V46Z" fill="#3b3355"/>`),
  gothique: svg(`<rect x="34" y="34" width="52" height="52" fill="#eee6d6" stroke="#a8916a" stroke-width="2"/><rect x="14" y="20" width="22" height="66" fill="#eee6d6" stroke="#a8916a" stroke-width="2"/><rect x="84" y="20" width="22" height="66" fill="#eee6d6" stroke="#a8916a" stroke-width="2"/><path d="M58 34 L60 6 L62 34Z" fill="#a8916a"/><circle cx="60" cy="46" r="9" fill="#5fa8e0" stroke="#a8916a" stroke-width="2"/><path d="M60 37 V55 M51 46 H69 M54 40 L66 52 M66 40 L54 52" stroke="#e0556a" stroke-width="1.5"/><path d="M50 86 V72 Q50 62 60 58 Q70 62 70 72 V86Z" fill="#8a5a2b"/><path d="M21 48 V38 Q21 32 25 30 Q29 32 29 38 V48Z M91 48 V38 Q91 32 95 30 Q99 32 99 38 V48Z" fill="#5fa8e0"/>`),
  "plein-cintre": svg(`<path d="M22 86 V48 A38 38 0 0 1 98 48 V86 H82 V48 A22 22 0 0 0 38 48 V86Z" fill="#e8dcc4" stroke="#a8916a" stroke-width="2"/>${[0, 30, 60, 90, 120, 150, 180].map((a) => { const r = (Math.PI * a) / 180; return `<line x1="${(60 - 22 * Math.cos(r)).toFixed(1)}" y1="${(48 - 22 * Math.sin(r)).toFixed(1)}" x2="${(60 - 38 * Math.cos(r)).toFixed(1)}" y2="${(48 - 38 * Math.sin(r)).toFixed(1)}" stroke="#a8916a" stroke-width="1.5"/>`; }).join("")}<path d="M38 48 A22 22 0 0 1 82 48" fill="none" stroke="#e0556a" stroke-width="2.5" stroke-dasharray="4 3"/>`),
  "arc-brise": svg(`<path d="M22 86 V50 Q24 18 60 6 Q96 18 98 50 V86 H82 V52 Q80 30 60 22 Q40 30 38 52 V86Z" fill="#eee6d6" stroke="#a8916a" stroke-width="2"/><path d="M38 52 Q40 30 60 22 Q80 30 82 52" fill="none" stroke="#e0556a" stroke-width="2.5" stroke-dasharray="4 3"/>`),
  voute: svg(`<path d="M14 86 V50 A30 30 0 0 1 74 50 V86 H64 V50 A20 20 0 0 0 24 50 V86Z" fill="#e8dcc4" stroke="#a8916a" stroke-width="2"/><path d="M44 20 L84 8 M14 50 L60 32 M74 50 L106 32" stroke="#a8916a" stroke-width="1.5" fill="none"/><path d="M60 32 A23 23 0 0 1 106 32 V70 M60 32 V70" fill="none" stroke="#a8916a" stroke-width="1.5"/><path d="M24 50 A20 20 0 0 1 64 50" fill="#d8c8a8" opacity=".6"/><path d="M14 86 L60 70 M74 86 L106 70" stroke="#a8916a" stroke-width="1" stroke-dasharray="3 2"/>`),
  "arc-boutant": svg(`<rect x="44" y="18" width="8" height="68" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><rect x="68" y="18" width="8" height="68" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><path d="M40 18 L60 4 L80 18Z" fill="#c0603a"/><rect x="26" y="50" width="6" height="36" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><rect x="88" y="50" width="6" height="36" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><path d="M26 50 L44 40 V52 L32 56Z M94 50 L76 40 V52 L88 56Z" fill="#d8c8a8"/>
    <rect x="6" y="40" width="10" height="46" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><rect x="104" y="40" width="10" height="46" fill="#e8dcc4" stroke="#a8916a" stroke-width="1.5"/><path d="M12 40 Q22 20 44 24 L44 30 Q24 28 16 46Z M108 40 Q98 20 76 24 L76 30 Q96 28 104 46Z" fill="#f39a2b" stroke="#c46a10" stroke-width="1.2"/><path d="M52 86 V60 Q52 50 60 46 Q68 50 68 60 V86" fill="none" stroke="#a8916a" stroke-width="1" stroke-dasharray="3 2"/>`),
  vitrail: svg(`<path d="M34 86 V40 Q36 12 60 4 Q84 12 86 40 V86Z" fill="#3b3355"/><g stroke="#3b3355" stroke-width="2.5"><path d="M37 84 V40 Q38 16 60 8 L60 40Z" fill="#3a7bd5"/><path d="M60 8 Q82 16 83 40 H60Z" fill="#e8473c"/><path d="M37 40 H60 V64 H37Z" fill="#f7d13d"/><path d="M60 40 H83 V64 H60Z" fill="#3bb08f"/><path d="M37 64 H60 V84 H37Z" fill="#8a5cc9"/><path d="M60 64 H83 V84 H60Z" fill="#f39a2b"/></g><circle cx="60" cy="40" r="8" fill="#fff4b0" stroke="#3b3355" stroke-width="2.5"/>`),
  rosace: svg(`<circle cx="60" cy="45" r="40" fill="#3b3355"/>${Array.from({ length: 8 }, (_, i) => `<ellipse cx="60" cy="22" rx="8" ry="16" fill="${["#3a7bd5", "#e8473c"][i % 2]}" stroke="#3b3355" stroke-width="2" transform="rotate(${i * 45} 60 45)"/>`).join("")}${Array.from({ length: 8 }, (_, i) => `<circle cx="60" cy="9" r="4.5" fill="#f7d13d" transform="rotate(${i * 45 + 22.5} 60 45)"/>`).join("")}<circle cx="60" cy="45" r="9" fill="#f7d13d" stroke="#3b3355" stroke-width="2"/>`),
  "ronde-bosse": svg(`<ellipse cx="60" cy="70" rx="46" ry="12" fill="none" stroke="#7a6cf0" stroke-width="2.5" stroke-dasharray="6 4"/><path d="M100 76 l8 -2 -4 8" fill="none" stroke="#7a6cf0" stroke-width="2.5"/><rect x="46" y="62" width="28" height="12" rx="2" fill="#d8d2e6"/><circle cx="60" cy="14" r="7" fill="#b9b1cc"/><path d="M51 24 q9 -5 18 0 l3 16 h-5 l-2 22 h-10 l-2 -22 h-5z" fill="#b9b1cc"/><circle cx="18" cy="40" r="5" fill="#f2c9a0"/><path d="M12 62 v-12 q6 -4 12 0 v12" fill="#ff8fab"/>`),
  "bas-relief": svg(`<rect x="10" y="10" width="72" height="70" rx="2" fill="#e2dccd"/><g fill="#f4efe2" stroke="#b9ae94" stroke-width="1.5"><circle cx="46" cy="28" r="8"/><path d="M34 74 l4 -30 q8 -6 16 0 l4 30z"/><path d="M54 46 l14 -10" stroke-width="5" stroke-linecap="round"/></g><path d="M38 74 l4 -30 M47 36 l2 -1" stroke="#a69a7f" stroke-width="2" opacity=".6"/>
    <rect x="96" y="10" width="8" height="70" fill="#e2dccd"/><path d="M104 20 q6 6 0 12 M104 40 q7 18 0 34" fill="#f4efe2" stroke="#b9ae94" stroke-width="1.5"/><text x="100" y="88" font-size="7" text-anchor="middle" fill="#8a829c">de profil</text>`),
  perspective: svg(`<rect x="6" y="4" width="108" height="40" fill="#dff1ff"/><rect x="6" y="44" width="108" height="42" fill="#9fd48a"/><path d="M40 86 L60 44 L80 86Z" fill="#c9b79a"/><path d="M60 86 V76 M60 70 V62 M60 57 V51 M60 48 V45" stroke="#fff" stroke-width="2"/>${[[24, 84, 12], [38, 62, 8], [47, 52, 5], [52, 47, 3]].map(([x, y, s]) => `<rect x="${x - s / 6}" y="${y - s * 1.2}" width="${s / 3}" height="${s * 1.2}" fill="#8a5a2b"/><circle cx="${x}" cy="${y - s * 1.6}" r="${s * 0.7}" fill="#3f9a4e"/>`).join("")}${[[96, 84, 12], [82, 62, 8], [73, 52, 5], [68, 47, 3]].map(([x, y, s]) => `<rect x="${x - s / 6}" y="${y - s * 1.2}" width="${s / 3}" height="${s * 1.2}" fill="#8a5a2b"/><circle cx="${x}" cy="${y - s * 1.6}" r="${s * 0.7}" fill="#3f9a4e"/>`).join("")}`),
  fuite: svg(`<rect x="6" y="4" width="108" height="82" fill="#f7f4ff"/><line x1="6" y1="40" x2="114" y2="40" stroke="#3a7bd5" stroke-width="1.5"/><path d="M6 6 L64 40 M6 86 L64 40 M114 6 L64 40 M114 86 L64 40" stroke="#e0556a" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M14 11 L40 26 L40 56 L14 79Z" fill="#c9bff7"/><path d="M104 14 L84 28 L84 52 L104 72Z" fill="#ffd2dc"/><circle cx="64" cy="40" r="3.5" fill="#e0556a"/>`),
  composition: svg(cadre(`<path d="M42 4 V86 M78 4 V86 M6 31 H114 M6 59 H114" stroke="#7a6cf0" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="42" cy="31" r="10" fill="#f39a2b"/><path d="M60 86 L78 56 L96 86Z" fill="#3bb08f"/><rect x="14" y="62" width="20" height="16" fill="#e0556a"/>`, "#fffdf6")),
  "clair-obscur": svg(`<rect x="6" y="4" width="108" height="82" rx="3" fill="#1f1a2e"/><defs><radialGradient id="ak-co" cx="40%" cy="38%" r="60%"><stop offset="0" stop-color="#fff2cf"/><stop offset=".55" stop-color="#d9a35c"/><stop offset="1" stop-color="#1f1a2e"/></radialGradient></defs><circle cx="58" cy="44" r="26" fill="url(#ak-co)"/><path d="M6 4 L40 4 L66 40" stroke="#fff2cf" stroke-width="1" opacity=".35" fill="none"/>`),
  touche: svg(`<rect x="6" y="4" width="108" height="82" rx="3" fill="#f7f4ff"/>${[["#3a7bd5", 16, 20], ["#5fa8e0", 34, 16], ["#f7d13d", 54, 22], ["#3a7bd5", 72, 14], ["#8a5cc9", 92, 20], ["#5fa8e0", 20, 44], ["#f39a2b", 44, 40], ["#3a7bd5", 64, 46], ["#f7d13d", 86, 42], ["#3bb08f", 26, 68], ["#5fa8e0", 50, 66], ["#3bb08f", 74, 70], ["#3a7bd5", 96, 66]].map(([c, x, y], i) => `<path d="M${x - 9} ${y + 4} q9 ${i % 2 ? -10 : -6} 18 -8" stroke="${c}" stroke-width="7" stroke-linecap="round" fill="none"/>`).join("")}`),
  symetrie: svg(`<line x1="60" y1="4" x2="60" y2="86" stroke="#e0556a" stroke-width="2" stroke-dasharray="5 3"/><path d="M58 44 Q30 6 14 24 Q6 44 34 48 Q12 58 24 76 Q40 84 58 52Z" fill="#8a5cc9"/><path d="M62 44 Q90 6 106 24 Q114 44 86 48 Q108 58 96 76 Q80 84 62 52Z" fill="#8a5cc9"/><circle cx="32" cy="30" r="6" fill="#f7d13d"/><circle cx="88" cy="30" r="6" fill="#f7d13d"/><rect x="57" y="24" width="6" height="44" rx="3" fill="#3b3355"/>`),
  fronton: svg(`<path d="M14 34 L60 8 L106 34Z" fill="#f7d13d" stroke="#c49a10" stroke-width="2"/><rect x="14" y="34" width="92" height="8" fill="#e8e2d2" stroke="#b9ae94"/>${[22, 38, 54, 70, 86].map((x) => `<rect x="${x}" y="42" width="8" height="38" fill="#f1ece0" stroke="#b9ae94"/>`).join("")}<rect x="10" y="80" width="100" height="6" fill="#e8e2d2" stroke="#b9ae94"/>`),
  estampe: svg(`<path d="M8 62 L44 50 L66 62 L30 76Z" fill="#c99a63" stroke="#8a5a2b" stroke-width="1.5"/><path d="M8 62 V68 L30 82 V76Z M30 76 V82 L66 68 V62Z" fill="#a8743f"/><path d="M22 64 q8 -8 16 -2 q-6 0 -6 5" stroke="#5a3a1a" stroke-width="1.5" fill="none"/><path d="M60 40 h12" stroke="#7a6cf0" stroke-width="2.5"/><path d="M70 36 l5 4 -5 4" fill="none" stroke="#7a6cf0" stroke-width="2.5"/><rect x="78" y="10" width="36" height="48" fill="#fffdf6" stroke="#d8d2e6" stroke-width="1.5"/><path d="M80 48 q6 -26 22 -18 q-8 0 -8 8 q4 -4 8 0 q-4 2 -2 8 q8 2 12 -2 V56 H80Z" fill="#2f5fa8"/><path d="M98 50 l4 -6 l4 6z" fill="#fff" stroke="#2f5fa8" stroke-width=".8"/>`),
  tympan: svg(`<rect x="14" y="20" width="92" height="66" fill="#e8dcc4" stroke="#a8916a" stroke-width="2"/><path d="M28 86 V54 A32 32 0 0 1 92 54 V86Z" fill="#cbb994" stroke="#a8916a" stroke-width="2"/><path d="M34 54 A26 26 0 0 1 86 54Z" fill="#f7d13d" stroke="#c49a10" stroke-width="2"/><circle cx="60" cy="40" r="4" fill="#c49a10"/><path d="M55 54 v-8 q5 -4 10 0 v8" fill="#c49a10"/><rect x="34" y="54" width="52" height="4" fill="#a8916a"/><rect x="40" y="58" width="40" height="28" fill="#8a5a2b"/><line x1="60" y1="58" x2="60" y2="86" stroke="#5a3a1a" stroke-width="1.5"/>`),
};

// Vocabulaire : niv = niveau d'apparition (chaque niveau reprend les mots des niveaux précédents).
// ex : œuvres du « Musée de la classe » qui illustrent bien le mot.
export const VOCAB = [
  { id: "portrait", mot: "un portrait", niv: "CE1", def: "La représentation d'une personne, souvent de son visage.", ex: ["joconde", "perle"] },
  { id: "autoportrait", mot: "un autoportrait", niv: "CE1", def: "Le portrait d'un artiste fait par lui-même." },
  { id: "paysage", mot: "un paysage", niv: "CE1", def: "La représentation d'un lieu : la campagne, la mer, la montagne, une ville…", ex: ["chasseurs", "impression"] },
  { id: "nature-morte", mot: "une nature morte", niv: "CE1", def: "La représentation d'objets immobiles : fruits, fleurs, vases, aliments…" },
  { id: "chaudes", mot: "les couleurs chaudes", niv: "CE1", def: "Les couleurs qui font penser au feu et au soleil : rouge, orange, jaune." },
  { id: "froides", mot: "les couleurs froides", niv: "CE1", def: "Les couleurs qui font penser à l'eau et à la glace : bleu, vert, violet.", ex: ["nuit-etoilee", "chasseurs"] },
  { id: "premier-plan", mot: "le premier plan", niv: "CE1", def: "Ce qui est le plus près de nous dans l'image, souvent en bas et en plus grand.", ex: ["chasseurs", "glaneuses"] },
  { id: "arriere-plan", mot: "l'arrière-plan", niv: "CE1", def: "Ce qui est le plus loin dans l'image, tout au fond.", ex: ["joconde", "chasseurs"] },
  { id: "sculpture", mot: "une sculpture", niv: "CE1", def: "Une œuvre en volume, taillée, modelée ou moulée dans une matière (pierre, bois, bronze…).", ex: ["penseur"] },
  { id: "parietal", mot: "une peinture pariétale", niv: "CE1", def: "Une peinture faite sur la paroi d'une grotte, à la Préhistoire.", ex: ["lascaux"] },
  { id: "horizon", mot: "la ligne d'horizon", niv: "CE2", def: "La ligne où le ciel semble toucher la terre ou la mer." },
  { id: "primaires", mot: "les couleurs primaires", niv: "CE2", def: "Le rouge, le jaune et le bleu : en les mélangeant, le peintre obtient les autres couleurs." },
  { id: "mosaique", mot: "une mosaïque", niv: "CE2", def: "Une image faite de petits morceaux de pierre ou de verre colorés, assemblés les uns à côté des autres." },
  { id: "colonne", mot: "une colonne", niv: "CE2", def: "Un grand pilier rond qui soutient une partie d'un bâtiment.", ex: ["parthenon"] },
  { id: "architecture", mot: "l'architecture", niv: "CE2", def: "L'art de concevoir et de construire des bâtiments.", ex: ["chambord", "tour-eiffel"] },
  { id: "fresque", mot: "une fresque", niv: "CE2", def: "Une peinture faite directement sur un mur, sur un enduit encore frais." },
  { id: "roman", mot: "l'art roman", niv: "CM1", def: "Le style des églises des XIe et XIIe siècles : murs épais, petites fenêtres, arcs en demi-cercle.", ex: ["cluny"] },
  { id: "gothique", mot: "l'art gothique", niv: "CM1", def: "Un style né au XIIe siècle : églises très hautes et lumineuses, grands vitraux, arcs brisés.", ex: ["notre-dame"] },
  { id: "plein-cintre", mot: "un arc en plein cintre", niv: "CM1", def: "Un arc en forme de demi-cercle, hérité des Romains et typique de l'art roman.", ex: ["pont-gard"] },
  { id: "arc-brise", mot: "un arc brisé", niv: "CM1", def: "Un arc pointu en haut, typique de l'art gothique." },
  { id: "voute", mot: "une voûte", niv: "CM1", def: "Un plafond en pierre, courbé en forme d'arc." },
  { id: "arc-boutant", mot: "un arc-boutant", niv: "CM1", def: "Un arc construit à l'extérieur d'une église gothique, qui soutient le haut des murs.", ex: ["notre-dame"] },
  { id: "vitrail", mot: "un vitrail", niv: "CM1", def: "Un assemblage de morceaux de verre colorés, tenus par des baguettes de plomb.", ex: ["notre-dame"] },
  { id: "rosace", mot: "une rosace", niv: "CM1", def: "Un grand vitrail rond, en forme de fleur, sur la façade d'une église.", ex: ["notre-dame"] },
  { id: "ronde-bosse", mot: "une ronde-bosse", niv: "CM1", def: "Une sculpture dont on peut faire le tour.", ex: ["penseur"] },
  { id: "bas-relief", mot: "un bas-relief", niv: "CM1", def: "Une sculpture qui ressort un peu d'un fond plat : on ne peut pas en faire le tour." },
  { id: "perspective", mot: "la perspective", niv: "CM1", def: "Une technique pour donner l'impression de profondeur sur une surface plate : ce qui est loin est dessiné plus petit." },
  { id: "fuite", mot: "le point de fuite", niv: "CM1", def: "Le point, souvent sur la ligne d'horizon, où semblent se rejoindre les lignes qui s'éloignent." },
  { id: "composition", mot: "la composition", niv: "CM2", def: "La façon dont l'artiste organise les formes, les couleurs et les personnages dans l'œuvre." },
  { id: "clair-obscur", mot: "le clair-obscur", niv: "CM2", def: "Un fort contraste entre des parties très éclairées et des parties très sombres." },
  { id: "touche", mot: "la touche", niv: "CM2", def: "La trace laissée par le pinceau sur la toile.", ex: ["impression", "nuit-etoilee"] },
  { id: "symetrie", mot: "la symétrie", niv: "CM2", def: "Les deux moitiés se ressemblent, comme dans un miroir, de chaque côté d'un axe.", ex: ["versailles"] },
  { id: "fronton", mot: "un fronton", niv: "CM2", def: "La partie en forme de triangle au-dessus des colonnes d'un temple ou de l'entrée d'un bâtiment.", ex: ["parthenon"] },
  { id: "estampe", mot: "une estampe", niv: "CM2", def: "Une image imprimée à partir d'une plaque gravée (en bois, en métal…).", ex: ["vague"] },
  { id: "tympan", mot: "un tympan", niv: "CM2", def: "La partie sculptée au-dessus de la porte d'une église, sous l'arc du portail." },
];

// Zones de composition (en % de l'image, x/y = coin haut gauche). Uniquement pour des tableaux dont la composition est
// très connue ; les rectangles sont larges. Si l'image chargée n'a pas le bon format (ratio), on affiche le schéma.
// schema : dessin simplifié de la composition, même repère (viewBox 0 0 100·ratio 100).
const W = (r) => +(100 * r).toFixed(1);
export const ZONES = [
  {
    oeuvre: "chasseurs",
    zones: [
      { mot: "le premier plan", x: 2, y: 42, w: 40, h: 50, info: "Les chasseurs et leurs chiens rentrent au village." },
      { mot: "l'arrière-plan", x: 64, y: 10, w: 34, h: 30, info: "Tout au fond, des montagnes enneigées." },
      { mot: "les patineurs", x: 46, y: 60, w: 44, h: 28, niv: "CE2", info: "Sur les étangs gelés, des gens patinent et jouent." },
    ],
    leurres: ["un portrait", "une rosace"],
    schema: (() => { const w = W(162 / 117); return `<svg viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true"><rect width="${w}" height="100" fill="#c9d6cc"/><rect y="0" width="${w}" height="38" fill="#b7cbc0"/>
      <path d="M86 40 L94 18 L100 30 L108 12 L116 28 L124 16 L132 34 L${w} 30 L${w} 46 L84 46Z" fill="#e8eef0" stroke="#8fa39a" stroke-width=".8"/>
      <path d="M0 40 L60 52 Q100 56 ${w} 50 L${w} 100 L0 100Z" fill="#eef2f0"/><path d="M0 40 L70 62 L0 96Z" fill="#f6f8f7"/>
      <ellipse cx="80" cy="74" rx="16" ry="6" fill="#9fb7b4"/><ellipse cx="108" cy="80" rx="18" ry="6" fill="#9fb7b4"/><ellipse cx="100" cy="66" rx="10" ry="3.5" fill="#9fb7b4"/>
      ${[[76, 72], [82, 75], [104, 79], [112, 81], [98, 65]].map(([x, y]) => `<path d="M${x} ${y} v-3 m-1 1 h2" stroke="#3b3355" stroke-width=".7"/><circle cx="${x}" cy="${y - 3.6}" r=".7" fill="#3b3355"/>`).join("")}
      ${[[10, 6], [22, 14], [34, 22], [46, 30]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.6" height="${70 - y}" fill="#5a4636"/>`).join("")}
      ${[[16, 66], [24, 70], [32, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y - 7}" r="2" fill="#3b2f2a"/><path d="M${x - 2.5} ${y} l1 -5 h3 l1 5z" fill="#3b2f2a"/><path d="M${x + 2} ${y - 6} l4 -8" stroke="#3b2f2a" stroke-width=".8"/>`).join("")}
      ${[[12, 76], [22, 80], [30, 82], [38, 80]].map(([x, y]) => `<path d="M${x} ${y} h5 l1 -2" stroke="#3b2f2a" stroke-width="1.4" fill="none"/>`).join("")}
      <rect x="2" y="30" width="16" height="10" fill="#8a6a50"/><path d="M0 30 L10 24 L20 30Z" fill="#6b4f3a"/></svg>`; })(),
  },
  {
    oeuvre: "joconde",
    zones: [
      { mot: "le visage", x: 32, y: 8, w: 32, h: 30, info: "Un sourire léger et mystérieux." },
      { mot: "les mains", x: 28, y: 70, w: 50, h: 22, info: "Les mains sont posées l'une sur l'autre." },
      { mot: "l'arrière-plan", x: 0, y: 12, w: 26, h: 40, info: "Un paysage imaginaire : montagnes, chemins, rivière." },
    ],
    leurres: ["une nature morte", "un arc-boutant"],
    schema: (() => { const w = W(53 / 77); return `<svg viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true"><rect width="${w}" height="100" fill="#8fa27a"/><rect width="${w}" height="40" fill="#b9c6a6"/>
      <path d="M0 30 L6 20 L12 28 L18 16 L${w} 18 L${w} 46 L0 50Z" fill="#7d9273"/><path d="M2 46 Q8 40 14 44" stroke="#c9b27a" stroke-width="1.2" fill="none"/><path d="M52 40 Q58 36 ${w} 38" stroke="#9fb7c4" stroke-width="1.6" fill="none"/>
      <path d="M8 100 Q8 50 34 42 Q60 50 60 100Z" fill="#3a3326"/><path d="M23 26 Q22 10 33 9 Q44 10 43 26 L45 46 L21 46Z" fill="#2b2418"/><ellipse cx="33" cy="25" rx="8" ry="10.5" fill="#d9b27a"/><path d="M25 22 Q33 12 41 22 Q38 15 33 14.5 Q28 15 25 22Z" fill="#2b2418"/><circle cx="30" cy="24" r=".8" fill="#3a2a1a"/><circle cx="36" cy="24" r=".8" fill="#3a2a1a"/>
      <path d="M30 30 q3 1.5 6 0" stroke="#7a5a3a" stroke-width=".8" fill="none"/><path d="M26 44 Q33 50 40 44 L38 48 Q33 52 28 48Z" fill="#c9a06a"/>
      <path d="M24 82 Q34 76 48 80 Q44 88 30 88Z" fill="#d9b27a"/><path d="M30 80 Q40 76 50 82" stroke="#b8925a" stroke-width=".8" fill="none"/></svg>`; })(),
  },
  {
    oeuvre: "nuit-etoilee",
    zones: [
      { mot: "le premier plan", x: 3, y: 12, w: 26, h: 86, info: "Un grand cyprès sombre, comme une flamme." },
      { mot: "la lune", x: 78, y: 2, w: 21, h: 24, info: "Un croissant de lune entouré de lumière." },
      { mot: "le village", x: 32, y: 66, w: 64, h: 32, info: "Un village endormi, avec le clocher d'une église." },
      { mot: "le ciel", x: 32, y: 8, w: 42, h: 34, niv: "CE2", info: "Le ciel tourbillonne, peint avec des touches épaisses." },
    ],
    leurres: ["une sculpture", "une voûte"],
    schema: (() => { const w = W(92.1 / 73.7); return `<svg viewBox="0 0 ${w} 100" preserveAspectRatio="none" aria-hidden="true"><rect width="${w}" height="100" fill="#20366e"/>
      <path d="M30 34 Q50 18 70 30 Q84 38 96 28" stroke="#6f93d6" stroke-width="3" fill="none"/><path d="M40 26 m-6 0 a6 6 0 1 0 12 0 a8 8 0 1 0 -16 0" stroke="#9fbcef" stroke-width="2" fill="none"/>
      ${[[40, 14], [60, 10], [70, 26], [96, 40], [110, 30], [52, 40], [82, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#f7e27a" opacity=".9"/><circle cx="${x}" cy="${y}" r="6.5" fill="none" stroke="#f7e27a" stroke-width=".8" opacity=".6"/>`).join("")}
      <circle cx="110" cy="13" r="10" fill="#f7d13d" opacity=".3"/><circle cx="110" cy="13" r="6.5" fill="#f7d13d"/><circle cx="113" cy="11" r="5.5" fill="#20366e"/>
      <path d="M0 60 Q30 52 60 60 T${w} 56 L${w} 70 L0 70Z" fill="#2f4d8a"/><path d="M28 70 L${w} 66 L${w} 100 L28 100Z" fill="#26407a"/>
      ${[[40, 80], [52, 84], [64, 78], [76, 84], [88, 80], [100, 86], [112, 82]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="6" fill="#3a5592"/><path d="M${x - 1} ${y} l4.5 -4 l4.5 4z" fill="#1d2f5c"/><rect x="${x + 2}" y="${y + 2}" width="2" height="2" fill="#f7d13d"/>`).join("")}
      <path d="M70 84 L72 64 L74 84Z" fill="#1d2f5c"/>
      <path d="M8 100 Q10 70 14 48 Q16 30 20 14 Q22 34 26 50 Q28 74 28 100Z" fill="#1c2a1e"/></svg>`; })(),
  },
];
