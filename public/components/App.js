
import React, { useState, useEffect } from 'react';
import NewsGrid from './NewsGrid';

const App = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('/api/news')
      .then(response => response.json())
      .then(data => setArticles(data.articles));
  }, []);

  return (
    <div>
      <h1>PacMac Prophecy Watch</h1>
      <NewsGrid articles={articles} />
    </div>
  );
};

export default App;
