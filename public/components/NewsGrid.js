
import React from 'react';
import NewsCard from './NewsCard';

const NewsGrid = ({ articles }) => {
  return (
    <div className="news-grid">
      {articles.map((article, index) => (
        <NewsCard key={index} article={article} />
      ))}
    </div>
  );
};

export default NewsGrid;
