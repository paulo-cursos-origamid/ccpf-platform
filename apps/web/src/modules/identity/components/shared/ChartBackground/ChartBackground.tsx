import styles from "./ChartBackground.module.scss";

export function ChartBackground() {
  return (
    <div className={styles.chart}>
      <svg
        viewBox="0 0 800 500"
        className={styles.svg}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="line"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor="var(--accent-primary)"
            />

            <stop
              offset="100%"
              stopColor="var(--accent-secondary)"
            />
          </linearGradient>

          <linearGradient
            id="fill"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor="rgba(34,197,94,.35)"
            />

            <stop
              offset="100%"
              stopColor="rgba(34,197,94,0)"
            />
          </linearGradient>
        </defs>

        <path
          className={styles.area}
          d="
          M0 420
          L70 360
          L150 330
          L250 280
          L360 300
          L470 220
          L560 250
          L670 150
          L800 100
          L800 500
          L0 500
          Z"
        />

        <polyline
          className={styles.line}
          points="
          0,420
          70,360
          150,330
          250,280
          360,300
          470,220
          560,250
          670,150
          800,100"
        />

        <circle cx="250" cy="280" r="6" className={styles.point} />
        <circle cx="470" cy="220" r="6" className={styles.point} />
        <circle cx="670" cy="150" r="6" className={styles.point} />
      </svg>
    </div>
  );
}