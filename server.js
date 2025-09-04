const express = require('express');
const fetch = require('node-fetch').default; 
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.post('/generate-image', async (req, res) => {
    const apiKey = "AIzaSyDRMK5e4gxbDG66IlYfgf0Yp6mANJ3BBIg"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseModalities: ["TEXT", "IMAGE"]
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // error message
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
        }

        const result = await response.json();

        let base64Data = null;
        if (result?.candidates?.[0]?.content?.parts) {
            for (const part of result.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    base64Data = part.inlineData.data;
                    break; 
                }
            }
        }

        if (base64Data) {
            res.json({ imageUrl: `data:image/png;base64,${base64Data}` });
        } else {
            res.status(500).json({ error: 'No image data received from the API.' });
        }

    } catch (err) {
        console.error('Image generation failed:', err);
        res.status(500).json({ error: `Failed to generate image: ${err.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});