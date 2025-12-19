// Pollen API Proxy - keeps your API key secure on the server
import 'dotenv/config';

export default async function handler(req, res) {
    // Enable CORS only for your domains
    const allowedOrigins = [
        'https://breeze.earth',
        'https://www.breeze.earth'
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { lat, lon } = req.query;

    if (!lat || !lon) {
        res.status(400).json({ error: 'Missing latitude or longitude' });
        return;
    }

    const apiKey = process.env.VITE_GOOGLE_POLLEN_API_KEY;

    if (!apiKey) {
        res.status(500).json({ error: 'API key not configured' });
        return;
    }

    try {
        const url = `https://pollen.googleapis.com/v1/forecast:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lon}&days=1&languageCode=en`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Pollen API error:', response.status, errorText);
            res.status(response.status).json({ error: 'Failed to fetch pollen data' });
            return;
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Pollen proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
