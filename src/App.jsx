import { useState, useEffect } from 'react';
import { Plus, Moon, Sun, Search, Rocket, LogOut } from 'lucide-react';
import IdeaForm from './components/IdeaForm';
import IdeaCard from './components/IdeaCard';
import Statistics from './components/Statistics';
import FilterPanel from './components/FilterPanel';
import Auth from './components/Auth';

import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [ideas, setIdeas] = useState([]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

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
    const fetchIdeas = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedIdeas = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setIdeas(fetchedIdeas);
      } catch (error) {
        console.error("Error fetching ideas: ", error);
      }
    };

    if (user) {
      fetchIdeas();
    }
  }, [user]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleAddIdea = async (newIdea) => {
    // Basic validation & Check duplicate titles locally
    if (!newIdea.title.trim() || !newIdea.description.trim() || !newIdea.problemStatement.trim()) {
      alert('Please fill in all required fields.');
      return false;
    }

    if (ideas.some(idea => idea.title.toLowerCase() === newIdea.title.toLowerCase())) {
      alert('An idea with this title already exists!');
      return false;
    }

    try {
      const ideaEntry = {
        ...newIdea,
        upvotes: 0,
        createdAt: new Date().toISOString(),
        userId: user.uid
      };
      const docRef = await addDoc(collection(db, 'ideas'), ideaEntry);

      setIdeas([{ id: docRef.id, ...ideaEntry }, ...ideas]);
      setIsFormOpen(false);
      return true;
    } catch (error) {
      console.error("Error adding idea: ", error);
      alert('Failed to save idea to Firebase. Did you set up the firebaseConfig correctly?');
      return false;
    }
  };

  const handleUpvote = async (id) => {
    try {
      const ideaToUpdate = ideas.find(idea => idea.id === id);
      const ideaRef = doc(db, 'ideas', id);
      await updateDoc(ideaRef, {
        upvotes: ideaToUpdate.upvotes + 1
      });
      setIdeas(ideas.map(idea =>
        idea.id === id ? { ...idea, upvotes: idea.upvotes + 1 } : idea
      ));
    } catch (error) {
      console.error("Error upvoting: ", error);
      alert('Failed to upvote idea on Firebase.');
    }
  };

  if (loadingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter ? idea.category === categoryFilter : true;
    const matchesDifficulty = difficultyFilter ? idea.difficulty === difficultyFilter : true;
    const matchesMarket = marketFilter ? idea.marketPotential === marketFilter : true;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesMarket;
  });

  const sortedIdeas = [...filteredIdeas].sort((a, b) => b.upvotes - a.upvotes);

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
          <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={20} />
            Submit Idea
          </button>
        </div>
      </header>

      <main className="dashboard-layout">
        <aside className="sidebar">
          <Statistics ideas={ideas} />
          <FilterPanel
            categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
            difficultyFilter={difficultyFilter} setDifficultyFilter={setDifficultyFilter}
            marketFilter={marketFilter} setMarketFilter={setMarketFilter}
          />
        </aside>

        <div className="cards-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="panel-title" style={{ margin: 0 }}>Discover Ideas</h2>
            <span className="badge badge-outline">{sortedIdeas.length} {sortedIdeas.length === 1 ? 'Idea' : 'Ideas'}</span>
          </div>

          {sortedIdeas.length > 0 ? (
            <div className="cards-grid">
              {sortedIdeas.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onUpvote={() => handleUpvote(idea.id)} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Rocket size={48} />
              <h3>No ideas found</h3>
              <p>Try adjusting your search or filters, or submit a new idea!</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsFormOpen(true)}>
                <Plus size={20} />
                Submit Idea
              </button>
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <IdeaForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleAddIdea}
        />
      )}
    </div>
  );
}

export default App;
