import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; 

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortType, setSortType] = useState(''); 

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/search?q=${query}`);
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      setError('Error fetching data. Please try again.');
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    try {
      const email = prompt('Enter your email:');
      if (!email) return;
      await axios.post('/send-email', { email, results });
      alert('Email sent!');
    } catch (error) {
      alert('Error sending email.');
    }
  };

  const sortResults = () => {
    let sortedResults = [...results];
    if (sortType === 'comments') {
      sortedResults.sort((a, b) => (b.comments || b.answers) - (a.comments || a.answers));
    } else if (sortType === 'score') {
      sortedResults.sort((a, b) => b.score - a.score);
    } else if (sortType === 'date') {
      sortedResults.sort((a, b) => new Date(b.creation_date) - new Date(a.creation_date));
    }
    setResults(sortedResults);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Knowledge Base Search</h1>
      
      <div className="search-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for topics..."
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">Search</button>
      </div>

      {loading && <p className="loading-text">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="sort-container">
        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          className="sort-dropdown"
        >
          <option value="">Sort By</option>
          <option value="comments">Comments/Answers</option>
          <option value="score">Score</option>
          <option value="date">Date</option>
        </select>
        <button onClick={sortResults} className="sort-button">Sort</button>
      </div>

      <div className="results-container">
        {results.length > 0 && (
          <>
            <h2>Search Results</h2>
            <ul className="results-list">
              {results.map((result, index) => (
                <li key={index} className="result-item">
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="result-title">
                    {result.title}
                  </a>
                  <p className="result-info">
                    Score: {result.score} | Answers/Comments: {result.answers || result.comments} | 
                    Date: {new Date(result.creation_date).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
            <button onClick={handleEmail} className="email-button">Send Results via Email</button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
