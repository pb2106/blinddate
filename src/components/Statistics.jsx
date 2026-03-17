import { Activity, BarChart2, PieChart } from 'lucide-react';

function Statistics({ ideas }) {
    const totalIdeas = ideas.length;

    const categories = ideas.reduce((acc, idea) => {
        acc[idea.category] = (acc[idea.category] || 0) + 1;
        return acc;
    }, {});

    const mostCommonCategory = totalIdeas > 0
        ? Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b)
        : 'N/A';

    const averageDifficulty = totalIdeas > 0
        ? (ideas.reduce((sum, idea) => sum + idea.difficulty, 0) / totalIdeas).toFixed(1)
        : 'N/A';

    return (
        <div className="glass-panel">
            <h2 className="panel-title">
                <Activity size={20} color="var(--accent-primary)" />
                Dashboard Stats
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="stat-box">
                    <div className="stat-icon">
                        <BarChart2 size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{totalIdeas}</span>
                        <span className="stat-label">Total Ideas</span>
                    </div>
                </div>

                <div className="stat-box">
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <PieChart size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value" style={{ fontSize: '1.25rem' }}>{mostCommonCategory}</span>
                        <span className="stat-label">Top Category</span>
                    </div>
                </div>

                <div className="stat-box">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <Activity size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{averageDifficulty}</span>
                        <span className="stat-label">Avg. Difficulty</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Statistics;
