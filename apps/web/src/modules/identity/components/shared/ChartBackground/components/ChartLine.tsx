import styles from "../ChartBackground.module.scss";

import { CHART_PATH } from "../chart.path";

export function ChartLine() {
  return <path id="chartPath" className={styles.line} d={CHART_PATH} />;
}
