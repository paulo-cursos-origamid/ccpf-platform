import styles from "../ChartBackground.module.scss";

const PARTICLES = [
  { id: "particle-1", cx: 120, cy: 150, r: 2 },
  { id: "particle-2", cx: 330, cy: 110, r: 1.5 },
  { id: "particle-3", cx: 520, cy: 170, r: 2 },
  { id: "particle-4", cx: 610, cy: 90, r: 1.5 },
  { id: "particle-5", cx: 730, cy: 210, r: 2 },
];

export function ChartParticles() {
  return (
    <g>
      {PARTICLES.map((particle, index) => (
        <circle
          key={particle.id}
          className={styles.particle}
          cx={particle.cx}
          cy={particle.cy}
          r={particle.r}
          style={{
            animationDelay: `${index * 0.7}s`,
          }}
        />
      ))}
    </g>
  );
}
