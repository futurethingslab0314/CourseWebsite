import React from 'react';

type CardShellProps = {
  className: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

const CardShell: React.FC<CardShellProps> = ({ className, style, children }) => {
  return (
    <section className={`card ${className}`} style={style}>
      {children}
    </section>
  );
};

export default CardShell;
