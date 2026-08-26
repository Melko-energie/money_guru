export type Point = { x: number; y: number }

/** Convertit une position sur le cercle (0 = midi, sens horaire) en coordonnées. */
export function pointCercle(cx: number, cy: number, rayon: number, ratio: number): Point {
  const angle = (ratio - 0.25) * Math.PI * 2
  return { x: cx + rayon * Math.cos(angle), y: cy + rayon * Math.sin(angle) }
}

/**
 * Chemin d'un segment d'anneau (donut) entre deux ratios de 0 à 1,
 * dessiné comme un arc épais aux extrémités arrondies via `stroke-linecap`.
 */
export function arcAnneau(
  cx: number,
  cy: number,
  rayon: number,
  debut: number,
  fin: number,
): string {
  const etendue = Math.max(0, Math.min(1, fin - debut))
  if (etendue <= 0) return ''
  // Un cercle complet ne peut pas être décrit par un seul arc SVG.
  const borne = Math.min(etendue, 0.9999)
  const p1 = pointCercle(cx, cy, rayon, debut)
  const p2 = pointCercle(cx, cy, rayon, debut + borne)
  const grandArc = borne > 0.5 ? 1 : 0
  return `M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} A ${rayon} ${rayon} 0 ${grandArc} 1 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`
}

/** Périmètre d'un cercle, pratique pour animer un `stroke-dashoffset`. */
export function perimetre(rayon: number): number {
  return 2 * Math.PI * rayon
}

/** Interpolation monotone (Catmull-Rom adouci) pour une courbe sans oscillation. */
export function cheminCourbe(points: Point[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const tension = 6
    const c1 = { x: p1.x + (p2.x - p0.x) / tension, y: p1.y + (p2.y - p0.y) / tension }
    const c2 = { x: p2.x - (p3.x - p1.x) / tension, y: p2.y - (p3.y - p1.y) / tension }
    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/** Referme une courbe sur la ligne de base pour obtenir une aire remplie. */
export function cheminAire(points: Point[], base: number): string {
  if (points.length === 0) return ''
  const ligne = cheminCourbe(points)
  const premier = points[0]
  const dernier = points[points.length - 1]
  return `${ligne} L ${dernier.x.toFixed(2)} ${base} L ${premier.x.toFixed(2)} ${base} Z`
}

/** Projette des valeurs dans une boîte de dessin (origine en haut à gauche). */
export function echelle(
  valeurs: number[],
  largeur: number,
  hauteur: number,
  marge = 0,
): Point[] {
  if (valeurs.length === 0) return []
  const max = Math.max(...valeurs)
  const min = Math.min(0, ...valeurs)
  const etendue = max - min || 1
  const hauteurUtile = hauteur - marge * 2
  const pas = valeurs.length > 1 ? largeur / (valeurs.length - 1) : 0
  return valeurs.map((v, i) => ({
    x: i * pas,
    y: marge + hauteurUtile - ((v - min) / etendue) * hauteurUtile,
  }))
}
