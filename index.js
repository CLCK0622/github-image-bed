const express = require('express');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer();

app.use(express.static('public'));

const { GITHUB_TOKEN, GITHUB_REPO } = process.env;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/`;

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const imageName = req.file.originalname;
        const imageContent = req.file.buffer.toString('base64');

        const response = await axios.put(
            `${GITHUB_API_URL}${imageName}`,
            {
                message: `Add ${imageName}`,
                content: imageContent
            },
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        res.status(200).json({
            message: 'Image uploaded successfully',
            url: response.data.content.download_url
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Image upload failed' });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});