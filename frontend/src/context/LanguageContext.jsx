/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        nav: {
            adventures: 'Adventures',
            gallery: 'Gallery',
            reviews: 'Reviews',
            about: 'About Us',
            book: 'Book Now'
        },
        hero: {
            tag: 'Born to Explore India',
            title1: 'DISCOVER THE',
            title2: 'UNSEEN BHARAT',
            subtitle: 'From the peaks of Himalayas to the ghats of Maharashtra. Experience the true spirit of Indian adventure with the country\'s most elite trekking community.',
            cta: 'Start Yatra',
            watch: 'Watch Video',
            stats: 'Happy Trekkers'
        },
        adventures: {
            subtitle: 'Upcoming Expeditions',
            title1: 'CHOOSE YOUR',
            title2: 'DESTINATION',
            viewAll: 'View All Treks',
            price: 'Starting at'
        },
        cta: {
            title1: 'READY FOR',
            title2: 'THE THRILL?',
            text: 'The mountains are calling. Don\'t just watch reels, come live the moment with us.',
            btn1: 'Book Next Trek',
            btn2: 'Chat on WhatsApp'
        },
        common: {
            loading: 'Loading...',
            bookNow: 'Book Now',
            viewDetails: 'View Details',
            back: 'Back',
            contact: 'Contact',
            about: 'About Us',
            gallery: 'Gallery',
            blog: 'Blog',
            login: 'Login',
            register: 'Register',
            logout: 'Logout',
            dashboard: 'Dashboard',
            cart: 'Cart',
            adventures: 'Adventures',
            price: 'Price',
            duration: 'Duration',
            difficulty: 'Difficulty',
            location: 'Location',
            participants: 'Participants',
            date: 'Date',
            status: 'Status',
            total: 'Total',
            payNow: 'Pay Now',
            confirm: 'Confirm',
            cancel: 'Cancel',
            save: 'Save',
            delete: 'Delete',
            edit: 'Edit',
            search: 'Search',
            filter: 'Filter',
            noResults: 'No results found',
            error: 'An error occurred',
            success: 'Success',
            submit: 'Submit',
            next: 'Next',
            previous: 'Previous',
        }
    },
    hi: {
        nav: {
            adventures: 'एडवेंचर्स',
            gallery: 'गैलरी',
            reviews: 'रिव्यु',
            about: 'हमारे बारे में',
            book: 'बुक करें'
        },
        hero: {
            tag: 'भारत को जानो',
            title1: 'देखो अपना',
            title2: 'अतुल्य भारत',
            subtitle: 'हिमालय की चोटियों से लेकर महाराष्ट्र के घाटों तक। देश की सबसे बेहतरीन ट्रेकिंग कम्युनिटी के साथ असली एडवेंचर का अनुभव करें।',
            cta: 'यात्रा शुरू करें',
            watch: 'वीडियो देखें',
            stats: 'खुश यात्री'
        },
        adventures: {
            subtitle: 'आने वाली यात्राएं',
            title1: 'चुनें अपनी',
            title2: 'मंजिल',
            viewAll: 'सभी ट्रेक देखें',
            price: 'शुरुआती कीमत'
        },
        cta: {
            title1: 'तैयार हैं',
            title2: 'रोमांच के लिए?',
            text: 'पहाड़ बुला रहे हैं। सिर्फ रील मत देखो, हमारे साथ आकर उन पलों को जियो।',
            btn1: 'ट्रेक बुक करें',
            btn2: 'व्हाट्सएप (WhatsApp)'
        },
        common: {
            loading: 'लोड हो रहा है...',
            bookNow: 'अभी बुक करें',
            viewDetails: 'विवरण देखें',
            back: 'वापस',
            contact: 'संपर्क',
            about: 'हमारे बारे में',
            gallery: 'गैलरी',
            blog: 'ब्लॉग',
            login: 'लॉगिन',
            register: 'रजिस्टर',
            logout: 'लॉगआउट',
            dashboard: 'डैशबोर्ड',
            cart: 'कार्ट',
            adventures: 'एडवेंचर्स',
            price: 'कीमत',
            duration: 'अवधि',
            difficulty: 'कठिनाई',
            location: 'स्थान',
            participants: 'प्रतिभागी',
            date: 'तारीख',
            status: 'स्थिति',
            total: 'कुल',
            payNow: 'अभी भुगतान करें',
            confirm: 'पुष्टि करें',
            cancel: 'रद्द करें',
            save: 'सहेजें',
            delete: 'हटाएं',
            edit: 'संपादित करें',
            search: 'खोजें',
            filter: 'फ़िल्टर',
            noResults: 'कोई परिणाम नहीं मिला',
            error: 'एक त्रुटि हुई',
            success: 'सफलता',
            submit: 'जमा करें',
            next: 'अगला',
            previous: 'पिछला',
        }
    },
    mr: {
        nav: {
            adventures: 'मोहिमा',
            gallery: 'गॅलरी',
            reviews: 'प्रतिक्रिया',
            about: 'आमच्याबद्दल',
            book: 'बुकिंग करा'
        },
        hero: {
            tag: 'सह्याद्रीची साद',
            title1: ' अनुभवा',
            title2: 'अतुल्य भारत',
            subtitle: 'हाकेला ओ देत डोंगराची, चला फिरूया रानावनात. महाराष्ट्राच्या कानाकोपऱ्यात दडलेल्या सौंदर्याचा शोध घेऊया.',
            cta: 'प्रवास सुरू करा',
            watch: 'व्हिडिओ पहा',
            stats: 'आनंदी पर्यटक'
        },
        adventures: {
            subtitle: 'आगामी मोहिमा',
            title1: 'निवडा तुमचे',
            title2: 'साहस',
            viewAll: 'सर्व ट्रेक्स पहा',
            price: 'सुरुवात फक्त'
        },
        cta: {
            title1: 'तयार आहात',
            title2: 'थरारासाठी?',
            text: 'गड-किल्ले आणि धबधबे तुमची वाट पाहत आहेत. फक्त सोशल मीडियावर बघू नका, प्रत्यक्षात अनुभव घ्या.',
            btn1: 'ट्रेक बुक करा',
            btn2: 'व्हॉट्सॲप (WhatsApp)'
        },
        common: {
            loading: 'लोड होत आहे...',
            bookNow: 'आता बुक करा',
            viewDetails: 'तपशील पहा',
            back: 'मागे',
            contact: 'संपर्क',
            about: 'आमच्याबद्दल',
            gallery: 'गॅलरी',
            blog: 'ब्लॉग',
            login: 'लॉगिन',
            register: 'नोंदणी',
            logout: 'लॉगआउट',
            dashboard: 'डॅशबोर्ड',
            cart: 'कार्ट',
            adventures: 'मोहिमा',
            price: 'किंमत',
            duration: 'कालावधी',
            difficulty: 'अडचण',
            location: 'स्थान',
            participants: 'सहभागी',
            date: 'तारीख',
            status: 'स्थिती',
            total: 'एकूण',
            payNow: 'आता पैसे भरा',
            confirm: 'पुष्टी करा',
            cancel: 'रद्द करा',
            save: 'जतन करा',
            delete: 'हटवा',
            edit: 'संपादित करा',
            search: 'शोधा',
            filter: 'फिल्टर',
            noResults: 'काहीही सापडले नाही',
            error: 'त्रुटी आली',
            success: 'यशस्वी',
            submit: 'सबमिट करा',
            next: 'पुढे',
            previous: 'मागे',
        }
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const toggleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'en') return 'hi';
            if (prev === 'hi') return 'mr';
            return 'en';
        });
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
