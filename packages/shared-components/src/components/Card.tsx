import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  const cardClass = className ? `${styles.card} ${className}` : styles.card;
  
  return (
    <div className={cardClass}>
      {children}
    </div>
  );
};

export default Card; 