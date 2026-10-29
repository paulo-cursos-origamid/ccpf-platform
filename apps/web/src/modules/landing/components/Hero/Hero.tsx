import {
  ArrowLeftRight,
  ArrowRight,
  BusFront,
  CalendarDays,
  Car,
  CircleDollarSign,
  CreditCard,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Tags,
  Wallet,
} from "@/components/icons";
import { BrandIcon } from "@/components/shared/BrandIcon";
import Link from "next/link";

import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import styles from "./Hero.module.scss";

const summary = [
  {
    label: "Saldo Atual",
    value: "R$ 24.530,00",
    change: "↑ 12,5%",
    tone: "green",
    icon: "◉",
  },
  {
    label: "Receitas do Mês",
    value: "R$ 15.780,00",
    change: "↑ 8,2%",
    tone: "cyan",
    icon: "↗",
  },
  {
    label: "Despesas do Mês",
    value: "R$ 7.250,00",
    change: "↓ 3,4%",
    tone: "pink",
    icon: "↘",
  },
  {
    label: "Total Investido",
    value: "R$ 18.900,00",
    change: "↑ 15,7%",
    tone: "purple",
    icon: "◈",
  },
] as const;

const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: CircleDollarSign, label: "Receitas" },
  { icon: Wallet, label: "Despesas" },
  { icon: ArrowLeftRight, label: "Transferências" },
  { icon: Landmark, label: "Investimentos" },
  { icon: Tags, label: "Categorias" },
  { icon: CalendarDays, label: "Relatórios" },
  { icon: CreditCard, label: "Metas" },
  { icon: Settings, label: "Configurações" },
];

const categories = [
  { name: "Moradia", value: "R$ 2.320,00", percent: 32, color: "blue" },
  { name: "Alimentação", value: "R$ 1.740,00", percent: 24, color: "teal" },
  { name: "Transporte", value: "R$ 1.080,00", percent: 15, color: "yellow" },
  { name: "Lazer", value: "R$ 725,00", percent: 10, color: "pink" },
  { name: "Outros", value: "R$ 1.385,00", percent: 19, color: "gray" },
] as const;

const goals = [
  {
    icon: "✈",
    name: "Viagem",
    value: "R$ 4.250,00 / R$ 8.000,00",
    percent: 53,
    color: "blue",
  },
  {
    icon: "◆",
    name: "Reserva de Emergência",
    value: "R$ 7.800,00 / R$ 15.000,00",
    percent: 52,
    color: "teal",
  },
  {
    icon: "▣",
    name: "Novo Carro",
    value: "R$ 12.350,00 / R$ 30.000,00",
    percent: 41,
    color: "yellow",
  },
] as const;

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

function CashFlowChart() {
  return (
    <div className={styles.cashChart}>
      <div className={styles.chartLegend}>
        <span className={styles.incomeLegend}>Receitas</span>
        <span className={styles.expenseLegend}>Despesas</span>
      </div>

      <svg
        viewBox="0 0 400 190"
        preserveAspectRatio="none"
        role="img"
        aria-label="Gráfico demonstrativo de receitas e despesas"
      >
        {[30, 65, 100, 135, 170].map((y) => (
          <line
            key={y}
            x1="0"
            x2="400"
            y1={y}
            y2={y}
            className={styles.gridLine}
          />
        ))}

        <polyline
          points="0,145 35,125 70,83 105,105 140,115 175,90 210,97 245,70 280,55 315,60 350,35 400,15"
          className={styles.incomeLine}
        />

        <polyline
          points="0,175 35,155 70,160 105,140 140,150 175,155 210,135 245,120 280,140 315,130 350,100 400,95"
          className={styles.expenseLine}
        />
      </svg>

      <div className={styles.chartMonths}>
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Menu className={styles.menuIcon} size={20} aria-hidden="true" />
          <strong>CCPF</strong>
        </div>

        <nav className={styles.sidebarNav} aria-label="Prévia de navegação">
          {navigation.map((item) => (
            <div
              key={item.label}
              className={`${styles.navItem} ${
                "active" in item && item.active ? styles.navActive : ""
              }`}
            >
              <item.icon size={18} strokeWidth={1.8} aria-hidden="true" />
              {item.label}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Sair</span>
        </div>
      </aside>

      <div className={styles.dashboardMain}>
        <header className={styles.dashboardHeader}>
          <div>
            <h2>Dashboard</h2>
            <p>Visão geral das suas finanças</p>
          </div>

          <div className={styles.dashboardUser}>
            <span>♧</span>
            <span>☾</span>
            <div className={styles.avatar}>JD</div>
            <span>Olá, João 👋</span>
            <span>⌄</span>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          {summary.map((item) => (
            <div key={item.label} className={styles.summaryCard}>
              <div className={styles.summaryLabel}>
                <span className={styles[`icon_${item.tone}`]}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              <strong>{item.value}</strong>

              <small>
                <span
                  className={
                    item.tone === "pink"
                      ? styles.negative
                      : styles.positive
                  }
                >
                  {item.change}
                </span>
                {" "}vs mês anterior
              </small>
            </div>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Fluxo de Caixa</h3>
              <span>Este mês ⌄</span>
            </div>

            <CashFlowChart />
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Top Categorias (Despesas)</h3>
            </div>

            <div className={styles.categoriesContent}>
              <div className={styles.donutChart} />

              <div className={styles.categoryList}>
                {categories.map((category) => (
                  <div key={category.name} className={styles.categoryItem}>
                    <span
                      className={`${styles.categoryDot} ${
                        styles[`color_${category.color}`]
                      }`}
                    />

                    <div>
                      <strong>{category.name}</strong>
                      <small>{category.value}</small>
                    </div>

                    <span>{category.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Evolução Mensal</h3>
              <span>Este ano ⌄</span>
            </div>

            <div className={styles.barChart}>
              {[52, 68, 67, 82, 61, 79, 72].map((height, index) => (
                <div key={months[index]} className={styles.barColumn}>
                  <div
                    className={styles.bar}
                    style={{ height: `${height}%` }}
                  />
                  <span>{months[index]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Metas</h3>
            </div>

            <div className={styles.goalsList}>
              {goals.map((goal) => (
                <div key={goal.name} className={styles.goal}>
                  <span
                    className={`${styles.goalIcon} ${
                      styles[`icon_${goal.color}`]
                    }`}
                  >
                    {goal.icon}
                  </span>

                  <div className={styles.goalContent}>
                    <div className={styles.goalHeading}>
                      <strong>{goal.name}</strong>
                      <small>{goal.value}</small>
                    </div>

                    <div className={styles.goalProgress}>
                      <span
                        className={styles[`progress_${goal.color}`]}
                        style={{ width: `${goal.percent}%` }}
                      />
                    </div>
                  </div>

                  <span className={styles.goalPercent}>
                    {goal.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className={styles.hero}>
      <AnimatedBackground />

      <div className={styles.backgroundGlow} />

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.heroBrand}>
            <BrandIcon className={styles.brandSymbol} size={72} />

            <div>
              <strong>CCPF</strong>
              <small>Centro de Custo Pessoal</small>
            </div>
          </div>

          <h1>
            Controle suas finanças
            <br />
            de forma simples e
            <span> inteligente.</span>
          </h1>

          <p className={styles.description}>
            O CCPF ajuda você a organizar receitas, despesas e
            investimentos em um único lugar, com clareza,
            segurança e praticidade.
          </p>

          <div className={styles.actions}>
            <Link href="/register" className={styles.primaryAction}>
              Começar Gratuitamente
              <span aria-hidden="true">⟶</span>
            </Link>

            <a href="#como-funciona" className={styles.secondaryAction}>
              <span className={styles.playIcon}>▶</span>
              Ver Demonstração
            </a>
          </div>

          <div className={styles.benefits}>
            <div>
              <span className={styles.benefitIcon}>♧</span>
              <div>
                <strong>100% Seguro</strong>
                <small>Seus dados protegidos</small>
              </div>
            </div>

            <div>
              <span className={styles.benefitIcon}>◖))</span>
              <div>
                <strong>Fácil de usar</strong>
                <small>Interface intuitiva</small>
              </div>
            </div>

            <div>
              <span className={styles.benefitIcon}>▣</span>
              <div>
                <strong>Acesso em qualquer lugar</strong>
                <small>Web e mobile</small>
              </div>
            </div>
          </div>

          <div className={styles.socialProof}>
            <div className={styles.proofAvatars}>
              <span>A</span>
              <span>B</span>
              <span>C</span>
            </div>

            <div>
              <div className={styles.stars}>★★★★★</div>
              <p>
                Organize sua vida financeira com mais
                controle e tranquilidade.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.preview}>
          <div className={styles.previewGlow} />
          <DashboardPreview />
        </div>
      </div>

      <div className={styles.bottomLines} aria-hidden="true" />
    </section>
  );
}