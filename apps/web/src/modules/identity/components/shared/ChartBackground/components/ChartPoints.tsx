import styles from "../ChartBackground.module.scss";

import { CHART_POINTS } from "../chart.points";

export function ChartPoints() {
  return (
    <>
      {CHART_POINTS.map((point, index) => (
        <circle
          key={point.id}
          cx={point.x}
          cy={point.y}
          r="6"
          className={styles.point}
          style={{
            animationDelay: `${index * 0.6}s`,
          }}
        />
      ))}
    </>
  );
}
