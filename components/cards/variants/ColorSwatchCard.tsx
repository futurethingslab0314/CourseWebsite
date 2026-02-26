import React from 'react';
import { MappedItem } from '../types';

type Props = {
  projectTitle: string;
  items: MappedItem[];
};

const ColorSwatchCard: React.FC<Props> = ({ projectTitle, items }) => {
  return (
    <div className="color-swatch__layout">
      <div className="color-swatch__grid">
        {items
          .flatMap((item) => item.colors)
          .slice(0, 12)
          .map((color) => (
            <div key={`${projectTitle}-${color}`} className="color-swatch__chip">
              <div className="color-swatch__preview" style={{ backgroundColor: color }} />
              <p className="card__text font-mono" style={{ marginTop: '0.5rem' }}>{color}</p>
            </div>
          ))}
      </div>
      <div className="color-swatch__panel">
        {items.slice(0, 4).map((item) => (
          <article key={`${projectTitle}-${item.title}`}>
            <h3 className="card__title">{item.title}</h3>
            {item.text ? <p className="card__text" style={{ marginTop: '0.3rem' }}>{item.text}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
};

export default ColorSwatchCard;
