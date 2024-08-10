const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

const app = express();
const upload = multer();

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REPO } = process.env;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/`;

app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/callback"
},
    function (accessToken, refreshToken, profile, done) {
        profile.accessToken = accessToken;
        return done(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.get('/auth/github',
    passport.authenticate('github', { scope: ['user', 'repo'] })
);

app.get('/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/');
    }
);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/css/styles.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/css/styles.css'));
});

app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const timestamp = Date.now();
        const originalName = req.file.originalname;
        const dotIndex = originalName.lastIndexOf('.');
        const baseName = originalName.substring(0, dotIndex);
        const extension = originalName.substring(dotIndex);

        const imageName = `${baseName}_${timestamp}${extension}`;
        const imageContent = req.file.buffer.toString('base64');

        const response = await axios.put(
            `${GITHUB_API_URL}${imageName}`,
            {
                message: `Add ${imageName}`,
                content: imageContent
            },
            {
                headers: {
                    Authorization: `Bearer ${req.user.accessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        res.status(200).json({
            message: `Image(${imageName}) uploaded to <a href="https://github.com/${GITHUB_REPO}">${GITHUB_REPO}</a> successfully!`,
            url: response.data.content.download_url
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Image upload failed' });
    }
});

module.exports = app;

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running at http://localhost:${PORT}`);
// });