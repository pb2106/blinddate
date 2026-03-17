import { ArrowUp, Target, TrendingUp, Cpu } from 'lucide-react';

function IdeaCard({ idea, onUpvote, onDelete, onEdit, onFavorite, user }) {
    const diffClass = `diff-${idea.difficulty}`;
    const diffBgClass = `diff-bg-${idea.difficulty}`;

    const getMarketColor = (market) => {
        switch (market) {
            case 'Low': return 'var(--market-low)';
            case 'Medium': return 'var(--market-med)';
            case 'High': return 'var(--market-high)';
            case 'Very High': return 'var(--market-very-high)';
            default: return 'var(--text-secondary)';
        }
    };

    const difficultyLabels = ["Easy", "Moderate", "Hard", "Very Hard", "Extremely Hard"];

    return (
        <div className="idea-card">
            <div className="card-header">
                <div>
                    <span className="card-category">{idea.category}</span>
                    <h3 className="card-title">{idea.title}</h3>
                </div>
                <span className={`badge ${diffBgClass}`}>
                    Diff: {idea.difficulty}
                </span>
            </div>

            <p className="card-desc">{idea.description}</p>

            <div style={{ background: 'var(--bg-base)', padding: '0.8rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent-primary)', marginBottom: '1rem' }}>
                <p className="card-problem">
                    <strong>Problem: </strong> {idea.problemStatement}
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                <div>
                    <div>Posted: {new Date(idea.createdAt).toLocaleDateString()}</div>
                    {idea.updatedAt && idea.updatedAt !== idea.createdAt && (
                        <div>Updated: {new Date(idea.updatedAt).toLocaleDateString()}</div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {idea.views !== undefined && <span>👁 {idea.views}</span>}
                    {idea.isArchived && <span style={{ color: 'var(--diff-5)', fontWeight: 'bold' }}>Archived</span>}
                </div>
            </div>

            <div className="card-footer">
                <div className="metrics">
                    <div className="metric">
                        <span className="metric-label">Difficulty</span>
                        <span className="metric-value">
                            <Cpu size={14} className={diffClass} />
                            <span className={diffClass}>{difficultyLabels[idea.difficulty - 1]}</span>
                        </span>
                    </div>

                    <div className="metric">
                        <span className="metric-label">Market</span>
                        <span className="metric-value" style={{ color: getMarketColor(idea.marketPotential) }}>
                            <TrendingUp size={14} />
                            {idea.marketPotential}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`action-btn ${idea.favoritedBy?.[user?.uid] ? 'favorited' : ''}`}
                        onClick={() => onFavorite(idea)}
                        aria-label="Favorite idea"
                        style={{
                            padding: '0.3rem 0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: idea.favoritedBy?.[user?.uid] ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                            color: idea.favoritedBy?.[user?.uid] ? '#ec4899' : 'var(--text-secondary)',
                            border: `1px solid ${idea.favoritedBy?.[user?.uid] ? '#ec4899' : 'var(--border-color)'}`,
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}
                    >
                        <span style={{ color: idea.favoritedBy?.[user?.uid] ? '#ec4899' : 'currentColor' }}>♥</span>
                    </button>
                    {onDelete && (
                        <>
                            <button
                                className="action-btn"
                                onClick={onEdit}
                                aria-label="Edit idea"
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '9999px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Edit
                            </button>
                            <button
                                className="btn-danger"
                                onClick={onDelete}
                                aria-label="Delete idea"
                                style={{ padding: '0.3rem 0.5rem' }}
                            >
                                Delete
                            </button>
                        </>
                    )}
                    <button
                        className={`upvote-btn ${idea.upvotes > 0 ? 'voted' : ''}`}
                        onClick={onUpvote}
                        aria-label="Upvote"
                    >
                        <ArrowUp size={16} />
                        {idea.upvotes}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default IdeaCard;
