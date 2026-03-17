import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { CATEGORIES, DIFFICULTY_LEVELS, MARKET_POTENTIALS } from '../data/constants';

function IdeaForm({ onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        category: CATEGORIES[0],
        difficulty: DIFFICULTY_LEVELS[0].value,
        marketPotential: MARKET_POTENTIALS[0],
        description: '',
        problemStatement: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'difficulty' ? Number(value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close form">
                    <X size={20} />
                </button>

                <h2 className="panel-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Submit Startup Idea</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="form-group">
                        <label htmlFor="title">Startup Title *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-control"
                            required
                            placeholder="e.g. NextGen AI Writer"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label htmlFor="category">Category</label>
                            <select
                                id="category"
                                name="category"
                                className="form-control"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="difficulty">Difficulty (1-5)</label>
                            <select
                                id="difficulty"
                                name="difficulty"
                                className="form-control"
                                value={formData.difficulty}
                                onChange={handleChange}
                            >
                                {DIFFICULTY_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="marketPotential">Market Potential</label>
                        <select
                            id="marketPotential"
                            name="marketPotential"
                            className="form-control"
                            value={formData.marketPotential}
                            onChange={handleChange}
                        >
                            {MARKET_POTENTIALS.map(market => (
                                <option key={market} value={market}>{market}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Short Description *</label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-control"
                            required
                            placeholder="Briefly describe what your startup does."
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="problemStatement">Problem Statement *</label>
                        <textarea
                            id="problemStatement"
                            name="problemStatement"
                            className="form-control"
                            required
                            placeholder="What specific problem does this solve?"
                            rows={3}
                            value={formData.problemStatement}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn-primary" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            <Send size={18} />
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default IdeaForm;
