import styles from "../ChartBackground.module.scss";

export function ChartArrow() {
  return (
    <g className={styles.arrow}>
      <polygon
        points="
          0,-12
          26,0
          0,12
          7,0
        "
        fill="var(--accent-secondary)"
      />
    </g>
  );
}
