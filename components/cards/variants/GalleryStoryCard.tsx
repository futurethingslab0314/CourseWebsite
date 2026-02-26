import React from 'react';
import { MappedItem } from '../types';

type Props = {
  projectTitle: string;
  items: MappedItem[];
};

const GalleryStoryCard: React.FC<Props> = ({ projectTitle, items }) => {
  const cover = items[0]?.images[0] || 'https://picsum.photos/1200/760';

  return (
    <>
      <img src={cover} alt={projectTitle} className="gallery-story__hero" />
      <div className="gallery-story__layout">
        <aside className="gallery-story__insight">
          <p className="card__micro">Insight</p>
          <p className="card__text">{items[0]?.text || 'No summary available.'}</p>
        </aside>
        <div className="gallery-story__grid">
          {items.map((item) => (
            <article key={`${projectTitle}-${item.title}-${item.text}`} className="card__item">
              <img src={item.images[0] || cover} alt={item.title} className="gallery-story__img" />
              <h3 className="card__title" style={{ marginTop: '0.75rem' }}>{item.title}</h3>
              {item.text ? <p className="card__text" style={{ marginTop: '0.35rem' }}>{item.text}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default GalleryStoryCard;
