import React from 'react';
import styles from './Hero.module.css';

interface HeroProps {
  title: string;
  className?: string;
}

const Hero: React.FC<HeroProps> = ({ title, className }) => {
  const heroClass = className ? `${styles.hero} ${className}` : styles.hero;
  
  return (
    <div className={heroClass}>
      <h1 className={styles.title}>{title}</h1>
    </div>
  );
};

export default Hero; 