import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain, Palmtree, ArrowRight } from 'lucide-react';
import './AddAdventure.css';

const AddAdventure = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(null);

    const categories = [
        {
            id: 'trek-camping',
            title: 'Trek / Camping',
            description: 'Create trekking adventures, camping trips, and outdoor expeditions',
            icon: Mountain,
            color: '#2f4a3e',
            features: ['Fixed pricing', 'Pickup points', 'Itinerary', 'Packing list', 'Do\'s & Don\'ts'],
        },
        {
            id: 'tour',
            title: 'Tour Package',
            description: 'Create multi-day tours with train/room options and advance payment',
            icon: Palmtree,
            color: '#c9a961',
            features: ['Train class options', 'Room sharing tiers', 'Advance payment', 'Multi-city departures'],
        },
    ];

    const handleSelect = (categoryId) => {
        if (categoryId === 'trek-camping') {
            navigate('/adventures/new/trek');
        } else if (categoryId === 'tour') {
            navigate('/adventures/new/tour');
        }
    };

    return (
        <div className="add-adventure-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create New Adventure</h1>
                    <p className="page-subtitle">Choose the type of adventure you want to create</p>
                </div>
            </div>

            <div className="category-selection">
                {categories.map((category) => {
                    const Icon = category.icon;
                    const isSelected = selectedCategory === category.id;

                    return (
                        <div
                            key={category.id}
                            className={`category-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                        >
                            <div className="category-icon" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                                <Icon size={40} />
                            </div>
                            <h3 className="category-title">{category.title}</h3>
                            <p className="category-description">{category.description}</p>
                            
                            <ul className="category-features">
                                {category.features.map((feature, idx) => (
                                    <li key={idx}>✓ {feature}</li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                className="category-select-btn"
                                style={{ backgroundColor: category.color }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(category.id);
                                }}
                            >
                                Choose {category.title}
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AddAdventure;
