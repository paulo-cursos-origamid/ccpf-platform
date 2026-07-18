import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Container } from "./Container";
import { Breadcrumbs } from "./Breadcrumbs";

import styles from "./AppLayout.module.scss";

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  return (
    <div className={styles.layout}>

      <Header />

      <div className={styles.body}>

        <Sidebar />

        <Container>
          <Breadcrumbs />

          {children}

        </Container>

      </div>

    </div>
  );
}