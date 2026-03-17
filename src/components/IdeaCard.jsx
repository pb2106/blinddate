import { ArrowUp, Target, TrendingUp, Cpu } from 'lucide-react';

function IdeaCard({ idea, onUpvote }) {
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

            <div style={{ background: 'var(--bg-base)', padding: '0.8rem', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent-primary)' }}>
                <p className="card-problem">
                    <strong>Problem: </strong> {idea.problemStatement}
                </p>
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
    );
}

export default IdeaCard;
