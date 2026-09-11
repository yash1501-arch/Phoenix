/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

const STORAGE_KEY = 'phoenix-lang';

export const translations = {
    en: {
        nav: {
            adventures: 'Adventures',
            gallery: 'Gallery',
            reviews: 'Reviews',
            about: 'About Us',
            book: 'Book Now',
            explore: 'Explore',
            tours: 'Tours',
            contact: 'Contact',
            login: 'Login',
            bookNow: 'Book now',
            bookATrek: 'Book a trek',
            signIn: 'Sign in',
            treks: 'Treks And Adventures',
            treksHint: 'Sahyadri fort day-hikes',
            camping: 'Camping And Outdoor Fun',
            campingHint: 'Overnight outdoors',
            menu: 'Menu',
            myTrips: 'My trips & profile',
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
        },
        booking: {
            bookTour: 'Book Now — Pay advance via UPI',
            bookTrek: 'Book Now — Pay full via UPI',
            loginToBook: 'Log in to book',
            payNow: 'Pay Now',
            waitlist: 'Join waitlist',
            joining: 'Joining…',
            waitlistHint: 'No upcoming departures — join the waitlist',
            waitlistDone: "We'll email/WhatsApp you when dates or seats open.",
            payHintTour: 'Tours: pay a UPI advance now (options extra). Remaining balance is due before departure.',
            payHintTrek: 'Treks: pay the full trip amount via UPI. Booking is confirmed after we verify your transfer.',
            browseHint: 'Browse freely — sign in when you are ready to reserve seats.',
            stayNote: 'Stay: Group stay — rooms are shared between 3 people (included in the package price).',
            payAdvance: 'Pay advance',
            payFull: 'Pay in full',
            proceed: 'Proceed to Payment',
        },
        cookie: {
            title: 'Cookies & privacy',
            body: 'We use cookies for authentication and to remember your wishlist. No ad trackers.',
            privacy: 'Privacy Policy',
            accept: 'Accept all',
            essential: 'Essential only',
        },
        dashboard: {
            payNow: 'Pay Now',
            underReview: 'Under Review',
            confirmed: 'Confirmed',
            rejected: 'Rejected',
            expired: 'Expired',
            cancelled: 'Cancelled',
        },
    },
    hi: {
        nav: {
            adventures: 'एडवेंचर्स',
            gallery: 'गैलरी',
            reviews: 'रिव्यु',
            about: 'हमारे बारे में',
            book: 'बुक करें',
            explore: 'घूमें',
            tours: 'टूर्स',
            contact: 'संपर्क',
            login: 'लॉगिन',
            bookNow: 'अभी बुक करें',
            bookATrek: 'ट्रेक बुक करें',
            signIn: 'साइन इन',
            treks: 'ट्रेक और एडवेंचर्स',
            treksHint: 'सह्याद्री किले की दिन-यात्रा',
            camping: 'कैंपिंग और आउटडोर',
            campingHint: 'रात भर बाहर',
            menu: 'मेनू',
            myTrips: 'मेरी यात्राएँ और प्रोफ़ाइल',
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
        },
        booking: {
            bookTour: 'अभी बुक करें — UPI से अग्रिम भुगतान',
            bookTrek: 'अभी बुक करें — UPI से पूरा भुगतान',
            loginToBook: 'बुक करने के लिए लॉगिन करें',
            payNow: 'अभी भुगतान करें',
            waitlist: 'वेटलिस्ट में जुड़ें',
            joining: 'जोड़ रहे हैं…',
            waitlistHint: 'कोई आगामी प्रस्थान नहीं — वेटलिस्ट में जुड़ें',
            waitlistDone: 'सीट या तारीख खुलने पर हम ईमेल/व्हाट्सएप करेंगे।',
            payHintTour: 'टूर: अभी UPI अग्रिम दें (विकल्प अतिरिक्त)। बाकी राशि प्रस्थान से पहले।',
            payHintTrek: 'ट्रेक: पूरी राशि UPI से दें। ट्रांसफर सत्यापन के बाद बुकिंग कन्फर्म होगी।',
            browseHint: 'आज़ादी से देखें — सीटें आरक्षित करने के लिए साइन इन करें।',
            stayNote: 'रुकना: ग्रुप स्टे — कमरे 3 लोगों में साझा (पैकेज में शामिल)।',
            payAdvance: 'अग्रिम भुगतान',
            payFull: 'पूरी राशि',
            proceed: 'भुगतान पर जाएँ',
        },
        cookie: {
            title: 'कुकीज़ और गोपनीयता',
            body: 'हम लॉगिन और विशलिस्ट के लिए कुकीज़ इस्तेमाल करते हैं। कोई विज्ञापन ट्रैकर नहीं।',
            privacy: 'गोपनीयता नीति',
            accept: 'सभी स्वीकार करें',
            essential: 'केवल ज़रूरी',
        },
        dashboard: {
            payNow: 'अभी भुगतान करें',
            underReview: 'समीक्षा में',
            confirmed: 'कन्फर्म',
            rejected: 'अस्वीकृत',
            expired: 'समाप्त',
            cancelled: 'रद्द',
        },
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
    const [language, setLanguageState] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'hi' || stored === 'en') return stored;
        } catch {
            // ignore
        }
        return 'en';
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // ignore
        }
        document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    }, [language]);

    const setLanguage = useCallback((lang) => {
        setLanguageState(lang === 'hi' ? 'hi' : 'en');
    }, []);

    const toggleLanguage = useCallback(() => {
        setLanguageState((prev) => (prev === 'en' ? 'hi' : 'en'));
    }, []);

    const t = translations[language] || translations.en;

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
