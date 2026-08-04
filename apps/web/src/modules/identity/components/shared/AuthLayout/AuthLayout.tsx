import styles from "./AuthLayout.module.scss";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return <main className={styles.container}>{children}</main>;
}
// import styles from "./AuthLayout.module.scss";

// interface AuthLayoutProps {
//   children: React.ReactNode;
// }

// export function AuthLayout({ children }: AuthLayoutProps) {
//   const items = Array.isArray(children)
//     ? children
//     : [children];

//   return (
//     <main className={styles.container}>
//       <section className={styles.left}>
//         {items[0]}
//       </section>

//       <section className={styles.right}>
//         {items[1]}
//       </section>
//     </main>
//   );
// }
