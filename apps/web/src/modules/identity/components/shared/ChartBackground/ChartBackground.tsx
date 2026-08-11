import styles from "./ChartBackground.module.scss";

import { CHART_HEIGHT, CHART_WIDTH } from "./chart.constants";

import { ChartDefs } from "./components/ChartDefs";
import { ChartGrid } from "./components/ChartGrid";

import { ChartLine } from "./components/ChartLine";
import { ChartPoints } from "./components/ChartPoints";
import { ChartArrow } from "./components/ChartArrow";
import { ChartParticles } from "./components/ChartParticles";
import { ChartArea } from "../ChartBackground/components/ChartArea"

export function ChartBackground() {
  return (
    <div className={styles.chart}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <ChartDefs />

        <ChartGrid />

        <ChartArea />

        <ChartLine />

        <ChartPoints />

        <ChartArrow />

        <ChartParticles />
      </svg>
    </div>
  );
}
