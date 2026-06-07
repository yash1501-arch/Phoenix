import React, { useState } from 'react';
import { Calendar, User, Tag, ChevronRight, Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import ScrollAnimation from '../components/ScrollAnimation';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: 1,
      title: 'Top 10 Trekking Destinations in India for Beginners',
      excerpt: 'Discover the best trekking spots in India perfect for beginners, with essential tips and gear recommendations.',
      category: 'Trekking',
      author: 'Rajesh Kumar',
      date: '2024-03-15',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Trekking', 'Beginner', 'India']
    },
    {
      id: 2,
      title: 'Essential Gear Guide for Mountain Camping',
      excerpt: 'A comprehensive guide to essential camping gear for mountain adventures, from tents to cooking equipment.',
      category: 'Camping',
      author: 'Priya Sharma',
      date: '2024-03-10',
      readTime: '10 min read',
      image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Camping', 'Gear', 'Safety']
    },
    {
      id: 3,
      title: 'Safety Tips for High-Altitude Adventures',
      excerpt: 'Learn crucial safety measures for high-altitude trekking, including altitude sickness prevention and emergency procedures.',
      category: 'Safety',
      author: 'Amit Patel',
      date: '2024-03-05',
      readTime: '12 min read',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Safety', 'Health', 'Tips']
    },
    {
      id: 4,
      title: 'Best Season for Different Adventure Activities',
      excerpt: 'Find out the ideal seasons for various adventure activities in India and plan your trip accordingly.',
      category: 'Travel',
      author: 'Rajesh Kumar',
      date: '2024-02-28',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Seasons', 'Planning', 'Activities']
    },
    {
      id: 5,
      title: 'Eco-Friendly Practices for Responsible Tourism',
      excerpt: 'How to minimize your environmental impact while enjoying outdoor adventures and supporting local communities.',
      category: 'Sustainability',
      author: 'Priya Sharma',
      date: '2024-02-20',
      readTime: '9 min read',
      image: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Environment', 'Sustainability', 'Responsible']
    },
    {
      id: 6,
      title: 'Preparing for Your First Adventure Trip',
      excerpt: 'A beginner\'s guide to preparing for your first adventure trip, covering fitness, training, and mental preparation.',
      category: 'Beginner',
      author: 'Amit Patel',
      date: '2024-02-15',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&h=400&q=80',
      tags: ['Beginner', 'Preparation', 'Fitness']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'Trekking', name: 'Trekking' },
    { id: 'Camping', name: 'Camping' },
    { id: 'Safety', name: 'Safety' },
    { id: 'Travel', name: 'Travel' },
    { id: 'Sustainability', name: 'Sustainability' },
    { id: 'Beginner', name: 'Beginner' }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
      <Navbar />
      
      <div className="pt-32 pb-16">
        {/* Hero Section */}
        <ScrollAnimation>
          <div className="text-center max-w-4xl mx-auto mb-16 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
                Adventure Insights
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black mb-6">
              Phoenix <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Blog</span>
            </h1>
            <p className="text-gray-800 text-lg md:text-xl leading-relaxed">
              Discover expert tips, inspiring stories, and practical advice for your next adventure. Learn from experienced guides and fellow adventurers.
            </p>
          </div>
        </ScrollAnimation>

        {/* Search and Filter Section */}
        <ScrollAnimation>
          <div className="container mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-professional border border-[#D4AF37]/20">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="text-[#D4AF37] w-5 h-5" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Featured Post */}
        {filteredPosts.length > 0 && (
          <ScrollAnimation>
            <div className="container mb-16">
              <div className="bg-white rounded-3xl overflow-hidden shadow-professional border border-[#D4AF37]/20">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="relative h-80 lg:h-full">
                    <img
                      src={filteredPosts[0].image}
                      alt={filteredPosts[0].title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#D4AF37] text-white text-sm font-semibold rounded-full">
                        {filteredPosts[0].category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {filteredPosts[0].author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(filteredPosts[0].date).toLocaleDateString()}
                      </div>
                      <div>{filteredPosts[0].readTime}</div>
                    </div>
                    <h2 className="text-3xl font-black text-black mb-4 leading-tight">
                      {filteredPosts[0].title}
                    </h2>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {filteredPosts[0].excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {filteredPosts[0].tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold hover:text-[#B8860B] transition-colors">
                      Read More
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        )}

        {/* Blog Posts Grid */}
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(1).map((post, index) => (
              <ScrollAnimation key={post.id} delay={index * 0.1}>
                <article className="bg-white rounded-2xl overflow-hidden shadow-professional hover:shadow-professional-lg transition-all border border-[#D4AF37]/20 group">
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#D4AF37] text-white text-sm font-semibold rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-black mb-3 leading-tight group-hover:text-[#D4AF37] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {post.readTime}
                      </div>
                      <button className="inline-flex items-center gap-2 text-[#D4AF37] font-semibold hover:text-[#B8860B] transition-colors">
                        Read More
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              </ScrollAnimation>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-500 text-lg">No articles found matching your criteria.</div>
            </div>
          )}
        </div>
      </div>
    <MobileTabBarSpacer />
    <Footer />
    </div>
  );
};

export default Blog;