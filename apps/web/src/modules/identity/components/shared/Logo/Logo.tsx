import { BrandIcon } from "@/components/shared/BrandIcon";
import styles from "./Logo.module.scss";

export function Logo() {
  return (
    <div className={styles.logo}>
      <BrandIcon size={32} />
      <span>CCPF</span>
    </div>
  );
}
