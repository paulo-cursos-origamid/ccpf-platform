import styles from "../ChartBackground.module.scss";

export function ChartArrow() {
  return (
    <g
      className={styles.arrow}
      transform="translate(790 80)"
    >
      <polygon
        points="
          0,-9
          20,0
          0,9
          5,0
        "
        fill="var(--accent-secondary)"
      />
    </g>
  );
}