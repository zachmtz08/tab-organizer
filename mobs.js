const MOBS = [
  {
    id: "slime",
    name: "Slime",
    viewBox: "0 0 12 10",
    body: `
      <rect x="4" y="2" width="4" height="1" fill="#86efac"/>
      <rect x="3" y="3" width="6" height="1" fill="#86efac"/>
      <rect x="2" y="4" width="8" height="4" fill="#4ade80"/>
      <rect x="3" y="5" width="1" height="1" fill="#0c1410"/>
      <rect x="8" y="5" width="1" height="1" fill="#0c1410"/>
      <rect x="4" y="7" width="4" height="1" fill="#15803d"/>
      <rect x="1" y="8" width="10" height="1" fill="#16a34a"/>
      <rect x="2" y="9" width="8" height="1" fill="#15803d"/>
    `,
  },
  {
    id: "ghost",
    name: "Ghost",
    viewBox: "0 0 10 12",
    body: `
      <rect x="2" y="1" width="6" height="1" fill="#e5e7eb"/>
      <rect x="1" y="2" width="8" height="8" fill="#e5e7eb"/>
      <rect x="3" y="4" width="1" height="2" fill="#0c0c14"/>
      <rect x="6" y="4" width="1" height="2" fill="#0c0c14"/>
      <rect x="4" y="7" width="2" height="1" fill="#f87171"/>
      <rect x="1" y="10" width="2" height="2" fill="#e5e7eb"/>
      <rect x="4" y="10" width="2" height="2" fill="#e5e7eb"/>
      <rect x="7" y="10" width="2" height="2" fill="#e5e7eb"/>
    `,
  },
  {
    id: "creeper",
    name: "Creeper",
    viewBox: "0 0 10 12",
    body: `
      <rect x="1" y="1" width="8" height="10" fill="#22c55e"/>
      <rect x="1" y="1" width="1" height="10" fill="#15803d"/>
      <rect x="8" y="1" width="1" height="10" fill="#15803d"/>
      <rect x="2" y="3" width="2" height="2" fill="#0a0a0a"/>
      <rect x="6" y="3" width="2" height="2" fill="#0a0a0a"/>
      <rect x="4" y="6" width="2" height="2" fill="#0a0a0a"/>
      <rect x="3" y="8" width="1" height="3" fill="#0a0a0a"/>
      <rect x="6" y="8" width="1" height="3" fill="#0a0a0a"/>
      <rect x="4" y="10" width="2" height="1" fill="#0a0a0a"/>
    `,
  },
  {
    id: "robot",
    name: "Robot",
    viewBox: "0 0 10 12",
    body: `
      <rect x="3" y="1" width="4" height="3" fill="#cbd5e1"/>
      <rect x="4" y="0" width="2" height="1" fill="#94a3b8"/>
      <rect x="4" y="2" width="1" height="1" fill="#ef4444"/>
      <rect x="6" y="2" width="1" height="1" fill="#ef4444"/>
      <rect x="4" y="4" width="2" height="1" fill="#475569"/>
      <rect x="2" y="5" width="6" height="5" fill="#94a3b8"/>
      <rect x="1" y="6" width="1" height="3" fill="#cbd5e1"/>
      <rect x="8" y="6" width="1" height="3" fill="#cbd5e1"/>
      <rect x="3" y="10" width="1" height="2" fill="#64748b"/>
      <rect x="6" y="10" width="1" height="2" fill="#64748b"/>
    `,
  },
  {
    id: "cat",
    name: "Cat",
    viewBox: "0 0 12 12",
    body: `
      <rect x="2" y="2" width="2" height="2" fill="#fb923c"/>
      <rect x="8" y="2" width="2" height="2" fill="#fb923c"/>
      <rect x="2" y="4" width="8" height="3" fill="#fb923c"/>
      <rect x="3" y="5" width="1" height="1" fill="#0c0c0c"/>
      <rect x="8" y="5" width="1" height="1" fill="#0c0c0c"/>
      <rect x="5" y="6" width="2" height="1" fill="#ec4899"/>
      <rect x="3" y="7" width="6" height="4" fill="#fb923c"/>
      <rect x="9" y="8" width="2" height="1" fill="#fb923c"/>
      <rect x="10" y="6" width="1" height="2" fill="#fb923c"/>
      <rect x="3" y="11" width="2" height="1" fill="#f97316"/>
      <rect x="7" y="11" width="2" height="1" fill="#f97316"/>
    `,
  },
  {
    id: "pumpkin",
    name: "Pumpkin",
    viewBox: "0 0 12 12",
    body: `
      <rect x="5" y="1" width="2" height="3" fill="#15803d"/>
      <rect x="4" y="2" width="1" height="2" fill="#16a34a"/>
      <rect x="2" y="5" width="8" height="6" fill="#ea580c"/>
      <rect x="3" y="4" width="6" height="1" fill="#fb923c"/>
      <rect x="3" y="5" width="6" height="6" fill="#fb923c"/>
      <rect x="3" y="6" width="2" height="2" fill="#0c0c0c"/>
      <rect x="7" y="6" width="2" height="2" fill="#0c0c0c"/>
      <rect x="3" y="9" width="6" height="1" fill="#0c0c0c"/>
      <rect x="4" y="10" width="1" height="1" fill="#fb923c"/>
      <rect x="6" y="10" width="1" height="1" fill="#fb923c"/>
    `,
  },
  {
    id: "bee",
    name: "Bee",
    viewBox: "0 0 14 10",
    body: `
      <rect x="3" y="1" width="3" height="2" fill="#fef3c7" opacity="0.6"/>
      <rect x="8" y="1" width="3" height="2" fill="#fef3c7" opacity="0.6"/>
      <rect x="2" y="4" width="9" height="4" fill="#fbbf24"/>
      <rect x="5" y="4" width="1" height="4" fill="#0c0c0c"/>
      <rect x="8" y="4" width="1" height="4" fill="#0c0c0c"/>
      <rect x="2" y="4" width="2" height="4" fill="#0c0c0c"/>
      <rect x="1" y="5" width="1" height="2" fill="#0c0c0c"/>
      <rect x="2" y="5" width="1" height="1" fill="#fff"/>
      <rect x="11" y="5" width="1" height="2" fill="#0c0c0c"/>
    `,
  },
  {
    id: "skeleton",
    name: "Skeleton",
    viewBox: "0 0 10 12",
    body: `
      <rect x="3" y="1" width="4" height="4" fill="#f1f5f9"/>
      <rect x="4" y="2" width="1" height="1" fill="#0c0c0c"/>
      <rect x="6" y="2" width="1" height="1" fill="#0c0c0c"/>
      <rect x="4" y="4" width="2" height="1" fill="#0c0c0c"/>
      <rect x="4" y="5" width="2" height="1" fill="#f1f5f9"/>
      <rect x="3" y="6" width="4" height="1" fill="#f1f5f9"/>
      <rect x="4" y="7" width="2" height="1" fill="#f1f5f9"/>
      <rect x="3" y="8" width="4" height="1" fill="#f1f5f9"/>
      <rect x="1" y="6" width="2" height="1" fill="#f1f5f9"/>
      <rect x="7" y="6" width="2" height="1" fill="#f1f5f9"/>
      <rect x="1" y="7" width="1" height="2" fill="#f1f5f9"/>
      <rect x="8" y="7" width="1" height="2" fill="#f1f5f9"/>
      <rect x="3" y="9" width="1" height="3" fill="#f1f5f9"/>
      <rect x="6" y="9" width="1" height="3" fill="#f1f5f9"/>
    `,
  },
];

const MAX_MOBS = 8;

function mobSVG(mob) {
  return `<svg viewBox="${mob.viewBox}" shape-rendering="crispEdges" aria-hidden="true">${mob.body}</svg>`;
}
