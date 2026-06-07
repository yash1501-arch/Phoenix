import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer, { MobileTabBarSpacer } from '../components/Footer';
import ScrollAnimation from '../components/ScrollAnimation';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Us',
      description: 'phoenixadventuress@gmail.com',
      action: 'Send us a message'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Us',
      description: '+91 98765 43210 / +91 77109 13905',
      action: 'Mon-Fri 9AM-6PM'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Visit Us',
      description: 'Sindhudurg Building, 56/C8, Kandivali, Charkop, Sahyadri Nagar, Kandivali West, Mumbai, Maharashtra 400067',
      action: 'Office hours: 10AM-5PM'
    }
  ];

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-b from-white to-[#F0E68C]/5">
      <Navbar />
      
      <div className="pt-28 sm:pt-32 pb-12 md:pb-16">
        <ScrollAnimation>
          <div className="text-center max-w-4xl mx-auto mb-10 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[#D4AF37] text-xs font-bold tracking-wider uppercase">
                Get In Touch
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black mb-6">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#B8860B]">Us</span>
            </h1>
            <p className="text-gray-800 text-lg md:text-xl leading-relaxed">
              Have questions about your next adventure? Reach out to our team of experts who are ready to help you plan the perfect journey.
            </p>
          </div>
        </ScrollAnimation>

        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ScrollAnimation>
              <div className="bg-white rounded-3xl p-8 shadow-professional border border-[#D4AF37]/20">
                <h2 className="text-2xl font-bold text-black mb-6">Send us a message</h2>
                
                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                    <CheckCircle className="text-green-600" />
                    <span className="text-green-800">Thank you for your message! We'll get back to you soon.</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all bg-white"
                      placeholder="What is this regarding?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent outline-none transition-all resize-none bg-white"
                      placeholder="Tell us about your adventure plans..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </ScrollAnimation>

            {/* Contact Information */}
            <ScrollAnimation delay={0.2}>
              <div>
                <h2 className="text-2xl font-bold text-black mb-6">Contact Information</h2>
                
                <div className="space-y-6 mb-8">
                  {contactMethods.map((method, index) => (
                    <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-[#D4AF37]/20 hover:shadow-professional transition-all">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        {method.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-black text-lg mb-1">{method.title}</h3>
                        <p className="text-gray-700 mb-1">{method.description}</p>
                        <p className="text-sm text-gray-500">{method.action}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Business Hours */}
                <ScrollAnimation delay={0.3}>
                  <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F0E68C]/10 rounded-2xl p-6 border border-[#D4AF37]/20">
                    <h3 className="font-bold text-black text-lg mb-3">Business Hours</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Monday - Friday</span>
                        <span className="font-semibold">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Saturday - Sunday</span>
                        <span className="font-semibold">10:00 AM - 4:00 PM</span>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    <MobileTabBarSpacer />
    <Footer />
    </div>
  );
};

export default Contact;