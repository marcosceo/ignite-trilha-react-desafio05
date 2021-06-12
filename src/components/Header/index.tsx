import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.headerContainer}>
      <Link href="/">
        <a>
          <img src="/img/logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
