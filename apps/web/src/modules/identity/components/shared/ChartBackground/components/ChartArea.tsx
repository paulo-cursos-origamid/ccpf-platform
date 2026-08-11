import styles from "../ChartBackground.module.scss";

import { CHART_AREA } from "../chart.path";


export function ChartArea() {
  return (
    <path
      className={styles.area}
      d={CHART_AREA}
    />
  );
}