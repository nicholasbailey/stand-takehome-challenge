import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation: React.FC = () => {
  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <h1 className={styles.navTitle}>Applied Sciences</h1>
        <div className={styles.navLinks}>
          <Link to="/rules" className={styles.navLink}>
            Edit Rules
          </Link>
          <Link to="/inspection" className={styles.navLink}>
            Test Rules
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 