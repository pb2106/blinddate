import { Filter } from 'lucide-react';
import { CATEGORIES, DIFFICULTY_LEVELS, MARKET_POTENTIALS } from '../data/constants';

function FilterPanel({
    categoryFilter, setCategoryFilter,
    difficultyFilter, setDifficultyFilter,
    marketFilter, setMarketFilter
}) {

    const clearFilters = () => {
        setCategoryFilter('');
        setDifficultyFilter('');
        setMarketFilter('');
    };

    const hasFilters = categoryFilter || difficultyFilter || marketFilter;

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="panel-title" style={{ margin: 0 }}>
                    <Filter size={20} color="var(--accent-primary)" />
                    Filters
                </h2>

                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="filter-group form-group">
                <label htmlFor="filter-category">Category</label>
                <select
                    id="filter-category"
                    className="form-control"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            <div className="filter-group form-group">
                <label htmlFor="filter-difficulty">Difficulty</label>
                <select
                    id="filter-difficulty"
                    className="form-control"
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : '')}
                >
                    <option value="">All Difficulties</option>
                    {DIFFICULTY_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                </select>
            </div>

            <div className="filter-group form-group">
                <label htmlFor="filter-market">Market Potential</label>
                <select
                    id="filter-market"
                    className="form-control"
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value)}
                >
                    <option value="">All Markets</option>
                    {MARKET_POTENTIALS.map(market => (
                        <option key={market} value={market}>{market}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default FilterPanel;
