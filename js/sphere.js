// Sphère texturée (planètes, globe) dessinée sans maillage : pour chaque pixel du disque,
// on calcule le point de la sphère qu'il montre (projection orthographique), puis sa
// latitude et sa longitude dans la carte équirectangulaire. Pas de facettes ni de couture.
// WebGL si possible, sinon un rendu 2D pixel par pixel (plus lent, en basse définition).
//
// Conventions (identiques à la projection du globe dans decouvrir.js) :
//  - lon, lat : point de la surface placé au centre du disque (radians) ;
//  - roll : inclinaison de l'axe dans le plan de l'écran (radians, sens horaire) ;
//  - light : direction de la lumière dans le repère de l'écran (x à droite, y en haut, z vers nous).

const VS = "attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}";
const FS = `precision highp float;
varying vec2 v;
uniform sampler2D tex;
uniform vec3 rot;      // lon, lat, roll
uniform vec3 light;
uniform float amb, px, scale, glow, limb;
uniform vec3 glowCol;
void main(){
  vec2 q = vec2(v.x, v.y) / scale;
  float cr = cos(rot.z), sr = sin(rot.z);
  float r = length(q);
  vec4 halo = vec4(0.);
  if (glow > 0. && r > 1.) { float f = clamp((r - 1.) / (1. / scale - 1.), 0., 1.); float h = glow * (1. - f) * (1. - f); halo = vec4(glowCol * h, h); }
  if (r > 1. + px) { gl_FragColor = halo; return; }
  vec2 qs = vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr);
  vec3 n = vec3(qs, sqrt(max(0., 1. - dot(qs, qs))));
  float cl = cos(rot.y), sl = sin(rot.y);
  vec3 b1 = vec3(n.x, n.y * cl + n.z * sl, -n.y * sl + n.z * cl);
  float co = cos(rot.x), so = sin(rot.x);
  vec3 b = vec3(b1.x * co + b1.z * so, b1.y, -b1.x * so + b1.z * co);
  float lat = asin(clamp(b.y, -1., 1.));
  float lon = atan(b.x, b.z);
  vec3 col = texture2D(tex, vec2(lon / 6.2831853 + .5, .5 - lat / 3.1415927)).rgb;
  vec3 ns = vec3(q, n.z);
  float d = max(dot(ns, light), 0.);
  col *= amb + (1. - amb) * d;
  col *= 1. - limb * pow(1. - n.z, 2.);
  if (glow > 0.) col = mix(col, glowCol, glow * .55 * pow(1. - n.z, 3.) * (.3 + d));
  float a = clamp((1. - r) / px + .5, 0., 1.);
  gl_FragColor = vec4(col, 1.) * a + halo * (1. - a);
}`;

const imgs = new Map();
export function chargerImage(url) {
  if (!imgs.has(url)) imgs.set(url, new Promise((ok, ko) => { const i = new Image(); i.decoding = "async"; i.onload = () => ok(i); i.onerror = ko; i.src = url; }));
  return imgs.get(url);
}

function normer(l) { const n = Math.hypot(...l) || 1; return l.map((x) => x / n); }
const DEF = { lon: 0, lat: 0, roll: 0, light: [-0.45, 0.45, 0.77], amb: 0.55, scale: 1, glow: 0, glowCol: [0.45, 0.7, 1], limb: 0.15 };

function rendererGL(canvas) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { console.warn("sphere: WebGL indisponible", e); return null; }
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ["tex", "rot", "light", "amb", "px", "scale", "glow", "glowCol", "limb"]) U[n] = gl.getUniformLocation(prog, n);
  const texs = new Map();
  const tex = (img) => {
    if (texs.has(img)) return texs.get(img);
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    // Pas de mipmaps : la discontinuité de atan() à ±180° provoquerait une ligne visible.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    texs.set(img, t); return t;
  };
  return {
    kind: "webgl",
    draw(img, size, o) {
      o = { ...DEF, ...o };
      if (canvas.width !== size || canvas.height !== size) { canvas.width = size; canvas.height = size; }
      gl.viewport(0, 0, size, size);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindTexture(gl.TEXTURE_2D, tex(img));
      gl.uniform1i(U.tex, 0);
      gl.uniform3f(U.rot, o.lon, o.lat, o.roll);
      gl.uniform3f(U.light, ...normer(o.light));
      gl.uniform1f(U.amb, o.amb); gl.uniform1f(U.scale, o.scale); gl.uniform1f(U.glow, o.glow); gl.uniform1f(U.limb, o.limb);
      gl.uniform1f(U.px, 2.2 / (size * o.scale));
      gl.uniform3f(U.glowCol, ...o.glowCol);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return canvas;
    },
  };
}

// Secours sans WebGL : même calcul, en JavaScript, sur 260 px au plus.
function renderer2D(canvas) {
  const g = canvas.getContext("2d");
  const pixels = new Map();
  const src = (img) => {
    if (pixels.has(img)) return pixels.get(img);
    const w = Math.min(1024, img.naturalWidth || img.width), h = w / 2;
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const cg = c.getContext("2d"); cg.drawImage(img, 0, 0, w, h);
    const d = { w, h, data: cg.getImageData(0, 0, w, h).data }; pixels.set(img, d); return d;
  };
  return {
    kind: "2d",
    draw(img, size, o) {
      o = { ...DEF, ...o };
      const s = Math.min(size, 260), t = src(img), L = normer(o.light);
      if (canvas.width !== s || canvas.height !== s) { canvas.width = s; canvas.height = s; }
      const out = g.createImageData(s, s), D = out.data;
      const cl = Math.cos(o.lat), sl = Math.sin(o.lat), co = Math.cos(o.lon), so = Math.sin(o.lon), cr = Math.cos(o.roll), sr = Math.sin(o.roll);
      for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
        const qx = ((i + 0.5) / s * 2 - 1) / o.scale, qy = (1 - (j + 0.5) / s * 2) / o.scale, r2 = qx * qx + qy * qy;
        if (r2 > 1) continue;
        const x = qx * cr - qy * sr, y = qx * sr + qy * cr, z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
        const by = y * cl + z * sl, bz1 = -y * sl + z * cl;
        const bx = x * co + bz1 * so, bz = -x * so + bz1 * co;
        const lat = Math.asin(Math.max(-1, Math.min(1, by))), lon = Math.atan2(bx, bz);
        const u = Math.min(t.w - 1, Math.floor((lon / (2 * Math.PI) + 0.5) * t.w)), v = Math.min(t.h - 1, Math.floor((0.5 - lat / Math.PI) * t.h));
        const k = (v * t.w + u) * 4, p = (j * s + i) * 4;
        const lit = (o.amb + (1 - o.amb) * Math.max(0, qx * L[0] + qy * L[1] + z * L[2])) * (1 - o.limb * (1 - z) ** 2);
        D[p] = t.data[k] * lit; D[p + 1] = t.data[k + 1] * lit; D[p + 2] = t.data[k + 2] * lit; D[p + 3] = 255;
      }
      g.putImageData(out, 0, 0);
      return canvas;
    },
  };
}

// Un seul moteur partagé, hors écran : chaque vue copie son résultat (drawImage) dans son propre canvas 2D.
let moteur = null;
export function rendu() {
  if (!moteur) {
    const c = document.createElement("canvas");
    moteur = rendererGL(c) || renderer2D(document.createElement("canvas"));
  }
  return moteur;
}

// Dessine la sphère dans le contexte 2D g, centrée en (cx, cy), de rayon r (pixels du contexte).
export function dessinerSphere(g, img, cx, cy, r, o = {}) {
  const scale = o.scale ?? DEF.scale;
  const half = r / scale, size = Math.max(8, Math.min(2048, Math.ceil(half * 2)));
  const c = rendu().draw(img, size, o);
  g.drawImage(c, cx - half, cy - half, half * 2, half * 2);
}

// Image figée d'une sphère (pour les petites planètes en orbite) : un canvas de 2r x 2r.
export function figer(img, r, o = {}) {
  const c = document.createElement("canvas"), s = Math.max(4, Math.ceil(r * 2));
  c.width = s; c.height = s;
  dessinerSphere(c.getContext("2d"), img, s / 2, s / 2, s / 2, o);
  return c;
}

// Anneaux de Saturne : la texture est une bande radiale (intérieur à gauche, extérieur à droite).
// On la transforme en disque vu de face, une seule fois. rIn, rOut en rayons de la planète.
export function disqueAnneaux(img, rIn = 1.28, rOut = 2.35, taille = 512) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const sc = document.createElement("canvas"); sc.width = w; sc.height = h;
  const sg = sc.getContext("2d"); sg.drawImage(img, 0, 0);
  const strip = sg.getImageData(0, Math.floor(h / 2), w, 1).data;
  const c = document.createElement("canvas"); c.width = taille; c.height = taille;
  const g = c.getContext("2d"), out = g.createImageData(taille, taille), D = out.data, R = taille / 2;
  for (let j = 0; j < taille; j++) for (let i = 0; i < taille; i++) {
    const rr = (Math.hypot(i + 0.5 - R, j + 0.5 - R) / R) * rOut;
    if (rr < rIn || rr > rOut) continue;
    const k = Math.min(w - 1, Math.floor(((rr - rIn) / (rOut - rIn)) * w)) * 4, p = (j * taille + i) * 4;
    // la texture est sombre : on la teinte en beige clair, l'alpha garde les divisions
    const l = (strip[k] + strip[k + 1] + strip[k + 2]) / 3 / 130;
    D[p] = Math.min(255, 150 + 105 * l); D[p + 1] = Math.min(255, 128 + 100 * l); D[p + 2] = Math.min(255, 92 + 80 * l); D[p + 3] = strip[k + 3];
  }
  g.putImageData(out, 0, 0);
  return { canvas: c, rOut };
}

// Dessine des anneaux (moitié arrière ou avant) autour d'une planète de rayon r.
// tilt : rapport hauteur/largeur de l'ellipse ; roll : rotation dans l'écran.
export function dessinerAnneaux(g, anneaux, cx, cy, r, { tilt = 0.34, roll = 0, moitie = "arriere" } = {}) {
  const R = r * anneaux.rOut;
  g.save(); g.translate(cx, cy); g.rotate(roll);
  g.beginPath();
  if (moitie === "arriere") g.rect(-R - 2, -R - 2, 2 * R + 4, R + 2); else g.rect(-R - 2, 0, 2 * R + 4, R + 2);
  g.clip();
  g.scale(1, tilt);
  g.drawImage(anneaux.canvas, -R, -R, 2 * R, 2 * R);
  g.restore();
}
