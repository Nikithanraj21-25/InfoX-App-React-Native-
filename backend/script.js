const { join } = require('path'); 
const express = require('express'); 
const dotenv = require('dotenv'); 
const { readFileSync } = require('fs'); 
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();

const corsOptions = {
  origin: '*', // Allow requests from the React Native app
  methods: ['GET', 'POST'], // Specify the allowed methods
};

app.use(cors(corsOptions));

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON request bodies
app.use(express.json());

app.post('/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }

    const base64Image = req.file.buffer.toString('base64');

    const apiKey = process.env.OPENAI_API_KEY;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please provide the extracted details in plain JSON format without any additional text or formatting or quotes. Include all the relevant information as shown below:

              {
                  "name": "Tom Fechter",
                  "company_name": "PIRTEK",
                  "phone": {
                  office: "414-800-6150",
                  mobile: "262-777-0936"
                },
                  "email": "tfechter@pirtekiwi.com",
                  "address": "W140N5955 Lilly Road, Menomonee Falls, WI 53051",
                  "website": "www.pirtekusa.com/locations/menomonee-falls",
                  "job_title": "President"
              }`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });

    console.log('OpenAI API Response:', response.data);

    const extractedText = response.data.choices[0].message.content;
    console.log(extractedText);

    // Assuming extractedText is a string that represents JSON
    let parsedData;
    try {
      parsedData = JSON.parse(extractedText);
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      return res.status(400).json({ error: 'Failed to parse extracted data.' });
    }

    // Send back the extracted information to the client
    res.json({ message: 'Data extracted and saved successfully', extractedText });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
});

// Export the app for Vercel
module.exports = app;
