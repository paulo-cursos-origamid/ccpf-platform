
import styles from "../ChartBackground.module.scss";

export function ChartGrid() {
  const horizontalLines = [100, 180, 260, 340, 420];

  const verticalLines = [80, 200, 320, 440, 560, 680];

  return (
    <g className={styles.grid}>
      {horizontalLines.map((y) => (
        <line
          key={`horizontal-${y}`}
          x1="-60"
          y1={y}
          x2="820"
          y2={y}
        />
      ))}

      {verticalLines.map((x) => (
        <line
          key={`vertical-${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="500"
        />
      ))}
    </g>
  );
}
