import React from 'react';
import { MappedItem } from '../types';

type Props = {
  projectTitle: string;
  items: MappedItem[];
};

const LinkCardsCard: React.FC<Props> = ({ projectTitle, items }) => {
  return (
    <div className="link-cards__grid">
      {items.map((item) => (
        <article key={`${projectTitle}-${item.title}-${item.text}`} className="card__item link-cards__item">
          <h3 className="card__title">{item.title}</h3>
          {item.text ? <p className="card__text">{item.text}</p> : null}
          <div className="link-cards__links">
            {item.links.slice(0, 3).map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer" className="link-cards__cta">
                Open resource
              </a>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
};

export default LinkCardsCard;
