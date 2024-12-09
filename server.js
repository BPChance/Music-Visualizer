const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = 5500;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:5500/callback';

// Serve static files
app.use(express.static(path.join(__dirname)));

// Generate a random string for state
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// Initial auth route
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    const scope = 'streaming user-read-email user-read-private user-modify-playback-state';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
        state: state
    });

    res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
});

// Callback route
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();
        if (data.error) {
            res.redirect('/#error=' + data.error);
            return;
        }

        // Redirect with token
        res.redirect(`/#access_token=${data.access_token}`);
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/#error=invalid_token');
    }
});

app.get('/refresh_token', async (req, res) => {
    const refresh_token = req.query.refresh_token;
    if (!refresh_token) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${5500}`);
});