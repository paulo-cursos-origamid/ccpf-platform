import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  FileChartColumn,
  Car,
  Settings,
} from "@/components/icons";

import styles from "./Sidebar.module.scss";

const menu = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Contas",
    icon: Wallet,
  },
  {
    label: "Categorias",
    icon: Tags,
  },
  {
    label: "Transações",
    icon: ArrowLeftRight,
  },
  {
    label: "Relatórios",
    icon: FileChartColumn,
  },
  {
    label: "Veículos",
    icon: Car,
  },
  {
    label: "Configurações",
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <a key={item.label} href="#" className={styles.item}>
              <span className={styles.icon}>
                <Icon size={20} />
              </span>

              <span className={styles.label}>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
