import { useState, useEffect } from 'react';
import { Plus, Moon, Sun, Search, Rocket, LogOut } from 'lucide-react';
import IdeaForm from './components/IdeaForm';
import IdeaCard from './components/IdeaCard';
import Statistics from './components/Statistics';
import FilterPanel from './components/FilterPanel';
import Auth from './components/Auth';
import ChatBot from './components/ChatBot';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIdea, setEditingIdea] = useState(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      fetchIdeas();
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      setIdeas([]);
    }
  }, [user, token]);

  const fetchIdeas = async () => {
    try {
      const res = await fetch(`${API_URL}/ideas`);
      if (res.ok) {
        const data = await res.json();
        setIdeas(data);
      }
    } catch (err) {
      console.error("Failed to fetch ideas", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  const handleOpenForm = (idea = null) => {
    setEditingIdea(idea);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingIdea(null);
    setIsFormOpen(false);
  };

  const handleAddIdea = async (ideaData) => {
    if (!ideaData.title.trim() || !ideaData.description.trim() || !ideaData.problemStatement.trim()) {
      alert('Please fill in all required fields.');
      return false;
    }

    try {
      if (editingIdea) {
        const res = await fetch(`${API_URL}/ideas/${editingIdea.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(ideaData)
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch(`${API_URL}/ideas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(ideaData)
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
      }
      await fetchIdeas();
      handleCloseForm();
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await fetch(`${API_URL}/ideas/${id}/upvote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFavorite = async (idea) => {
    try {
      const res = await fetch(`${API_URL}/ideas/${idea.id}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchIdeas();
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = async (id) => {
    try {
      await fetch(`${API_URL}/ideas/${id}/view`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  // Filter ideas based on state, handling visibility and archived logic on the client
  // Only show active and unarchived ideas, UNLESS the user owns the idea
  const filteredIdeas = ideas.filter(idea => {
    const isOwner = idea.userId === user.id;

    if (!isOwner && (idea.visibility === 'Hidden' || idea.isArchived)) {
      return false;
    }

    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? idea.category === categoryFilter : true;
    const matchesDifficulty = difficultyFilter ? idea.difficulty === difficultyFilter : true;
    const matchesMarket = marketFilter ? idea.marketPotential === marketFilter : true;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMarket;
  });

  return (
    <div className="app-container">
      <header>
        <div className="brand-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Rocket size={32} color="var(--accent-primary)" />
          IdeaSpace
        </div>
        <div className="header-actions">
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="form-control"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" onClick={handleLogout} aria-label="Log Out" title="Log Out">
            <LogOut size={20} />
          </button>
          <button className="btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={20} />
            Submit Idea
          </button>
        </div>
      </header>

      <main className="dashboard-layout">
        <aside className="sidebar">
          <Statistics ideas={filteredIdeas} />
          <FilterPanel
            categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            difficultyFilter={difficultyFilter} setDifficultyFilter={setDifficultyFilter}
            marketFilter={marketFilter} setMarketFilter={setMarketFilter}
          />
        </aside>

        <div className="cards-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Discover Ideas</h2>
            <span className="badge badge-outline">{filteredIdeas.length} {filteredIdeas.length === 1 ? 'Idea' : 'Ideas'}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading ideas...</div>
          ) : filteredIdeas.length > 0 ? (
            <div className="cards-grid">
              {filteredIdeas.map(idea => (
                <div key={idea.id} onClick={() => handleView(idea.id)}>
                  <IdeaCard
                    idea={idea}
                    user={{ uid: user.id }} // Maintain compatibility with previous favoriting logic using .uid
                    onUpvote={() => handleUpvote(idea.id)}
                    onEdit={idea.userId === user.id ? () => handleOpenForm(idea) : null}
                    onFavorite={() => handleFavorite(idea)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Rocket size={48} />
              <h3>No ideas found</h3>
              <p>Try adjusting your search or filters, or submit a new idea!</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => handleOpenForm()}>
                <Plus size={20} />
                Submit Idea
              </button>
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <IdeaForm
          defaultIdea={editingIdea}
          onClose={handleCloseForm}
          onSubmit={handleAddIdea}
        />
      )}

      <ChatBot />
    </div>
  );
}

export default App;
