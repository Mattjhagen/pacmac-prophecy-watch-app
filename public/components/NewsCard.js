
import React from 'react';

const NewsCard = ({ article }) => {
  return (
    <div className="news-card">
      <div className="news-card-inner">
        <div className="news-card-front">
          <h2>{article.title}</h2>
        </div>
        <div className="news-card-back">
          <p>{article.content}</p>
          <a href={article.link} target="_blank" rel="noopener noreferrer">Read More</a>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
