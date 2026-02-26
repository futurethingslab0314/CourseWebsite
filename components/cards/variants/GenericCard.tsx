import React from 'react';
import { MappedItem } from '../types';

type Props = {
  projectTitle: string;
  items: MappedItem[];
};

const GenericCard: React.FC<Props> = ({ projectTitle, items }) => {
  return (
    <div className="generic-cards__list">
      {items.map((item) => (
        <article key={`${projectTitle}-${item.title}-${item.text}`} className="card__item">
          <h3 className="card__title">{item.title}</h3>
          {item.text ? <p className="card__text" style={{ marginTop: '0.5rem' }}>{item.text}</p> : null}
          {(item.images.length > 0 || item.links.length > 0 || item.colors.length > 0) && (
            <div className="generic-cards__meta">
              {item.images[0] ? <img src={item.images[0]} alt={item.title} className="generic-cards__thumb" /> : null}
              {item.links[0] ? (
                <a href={item.links[0]} target="_blank" rel="noreferrer" className="generic-cards__link">
                  Reference link
                </a>
              ) : null}
              {item.colors[0] ? (
                <span className="generic-cards__swatch">
                  <span className="generic-cards__dot" style={{ backgroundColor: item.colors[0] }} />
                  {item.colors[0]}
                </span>
              ) : null}
            </div>
          )}
        </article>
      ))}
    </div>
  );
};

export default GenericCard;
