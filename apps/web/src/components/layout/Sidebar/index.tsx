import styles from "./Sidebar.module.scss";

const menu = [
  "Dashboard",
  "Contas",
  "Categorias",
  "Transações",
  "Relatórios",
  "Veículos",
  "Configurações",
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav>
        {menu.map((item) => (
          <a key={item}>
            {item}
          </a>
        ))}
      </nav>
    </aside>
  );
}