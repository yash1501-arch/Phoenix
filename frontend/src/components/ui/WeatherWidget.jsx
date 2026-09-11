import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Wind, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Open-Meteo: no API key, free, CORS-enabled.
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_2m&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather failed');
    return res.json();
}

const codeToInfo = (code) => {
    if (code === 0) return { label: 'Clear', Icon: Sun, color: 'text-amber-400' };
    if (code <= 3) return { label: 'Cloudy', Icon: Cloud, color: 'text-zinc-300' };
    if (code >= 51 && code <= 67) return { label: 'Rain', Icon: CloudRain, color: 'text-sky-400' };
    if (code >= 80) return { label: 'Rain', Icon: CloudRain, color: 'text-sky-400' };
    return { label: 'Mist', Icon: Cloud, color: 'text-zinc-300' };
};

// Curated POI catalog — a few of our signature spots
const PRESETS = {
    kalsubai: { lat: 19.6011, lon: 73.7117, name: 'Kalsubai' },
    rajmachi: { lat: 18.8483, lon: 73.3811, name: 'Rajmachi' },
    hampta: { lat: 32.2450, lon: 77.3550, name: 'Hampta Pass' },
    sandhanavalley: { lat: 19.4900, lon: 73.7600, name: 'Sandhan Valley' },
};

export default function WeatherWidget({ preset = 'kalsubai', locationName }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { lat, lon, name } = PRESETS[preset] || PRESETS.kalsubai;
    // Show the adventure's own location name even when we use a nearby preset for coordinates
    const displayName = locationName || name;

    useEffect(() => {
        let active = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        fetchWeather(lat, lon)
            .then((d) => { if (active) { setData(d); setError(null); } })
            .catch((e) => { if (active) setError(e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [lat, lon]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading weather…
            </div>
        );
    }
    if (error || !data?.current) {
        return <div className="text-zinc-500 text-xs">Weather unavailable</div>;
    }

    const { temperature_2m, weather_code, wind_speed_2m } = data.current;
    const { label, Icon, color } = codeToInfo(weather_code);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-mist-subtle/5 border border-white/10 text-sm"
        >
            <Icon className={color} size={20} />
            <div>
                <div className="text-white font-semibold">{Math.round(temperature_2m)}°C · {label}</div>
                <div className="text-zinc-400 text-xs flex items-center gap-2">
                    <span>{displayName}</span>
                    <Wind size={11} /> {Math.round(wind_speed_2m)} km/h
                </div>
            </div>
        </motion.div>
    );
}
