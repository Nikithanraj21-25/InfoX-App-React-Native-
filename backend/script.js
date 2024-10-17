const { Sequelize, DataTypes} = require('sequelize');
const { join } = require('path'); // Import path for handling file paths
const express = require('express'); // Import express to create the server
const dotenv = require('dotenv'); // Import dotenv to load environment variables
const { readFileSync } = require('fs'); // Import 'fs' to read files
const axios = require('axios');// Import axios for HTTP requests
const multer = require('multer');
const cors = require('cors'); // Import CORS

// Load environment variables
dotenv.config();

// Create an instance of express
const app = express();
const port = 3000; // Define the port number

const corsOptions = {
  origin: '*', // Allow requests from the React Native app
  methods: ['GET', 'POST'], // Specify the allowed methods
};

app.use(cors(corsOptions));

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' }); // 'uploads/' is where images will be temporarily stored

// Middleware to parse JSON request bodies
app.use(express.json());

// Initialize Sequelize to connect to PostgreSQL
const sequelize = new Sequelize(process.env.PG_URI, {
  dialect: 'postgres',
});

// Test the connection
sequelize.authenticate().then(() => {
  console.log('Connected to PostgreSQL');
}).catch((err) => {
  console.error('Unable to connect to PostgreSQL:', err);
});

// Define a schema for the extracted information
// const extractedInfoSchema = new mongoose.Schema({
//   serialNo: Number,
//   name: String,
//   businessName: String,
//   phone: String,
//   email: String,
//   address: String,
//   website: String,
// });
const ExtractedInfo = sequelize.define('ExtractedInfo', {
  serialNo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otherInfo: {
    type: DataTypes.TEXT, // Use TEXT to store larger information
    allowNull: true,
  },
  date: {
    type: DataTypes.DATEONLY, // Use DATE type for date and time
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME, // Store time
    allowNull: false,
  },
}, {
  timestamps: false,
});

// Sync the model with the database
sequelize.sync().then(() => {
  console.log('ExtractedInfo table created');
}).catch((err) => {
  console.error('Error creating table:', err);
});

// Define an endpoint for the image processing
app.post('/process-image',upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded.' });
    }

    const imagePath = join(__dirname, req.file.path); // Get the file path

    // Read image as base64
    const base64Image = readFileSync(imagePath).toString('base64');

    // Set headers and payload for the OpenAI API request
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
              text: `Please provide the extracted details in plain JSON format without any additional text or formatting: {
            "name": "John Doe",
            "company_name": "Example Inc.",
            "phone": "123-456-7890",
            "email": "john.doe@example.com",
            "address": "123 Main St, Anytown, USA",
            "website": "www.example.com",
            "additional_info": "Notes or other relevant info"
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

    // Make the POST request to OpenAI API
    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, { headers });

    // Log the entire response
console.log('OpenAI API Response:', response.data);

    // Extracting the message content for better readability
    const extractedText = response.data.choices[0].message.content;

    // Assuming extractedText is a string that represents JSON
    let parsedData;
    try {
      parsedData = JSON.parse(extractedText);
    } catch (error) {
      console.error('Error parsing JSON:', error.message);
      return res.status(400).json({ error: 'Failed to parse extracted data.' });
    }

    // const lastRecord = await ExtractedInfo.findOne().sort({ serialNo: -1 }); // MongoDB code
    const lastRecord = await ExtractedInfo.findOne({
      order: [['serialNo', 'DESC']],
    });
    
    // Get the last document
    const newSerialNo = lastRecord ? lastRecord.serialNo + 1 : 1; // Increment the serial number

    // Prepare the other info
    const otherInfo = Object.entries(parsedData)
      .filter(([key]) => !['name', 'businessName', 'phone', 'email', 'address', 'website'].includes(key)) // Exclude specific fields
      .map(([key, value]) => `${key}: ${value}`) // Create key-value pairs
      .join('\n'); // Join them with new line for better readability

    // Create a new document in MongoDB using parsed data
    const newExtractedInfo = await ExtractedInfo.create({
      serialNo: newSerialNo,
      name: parsedData.name,
      businessName: parsedData.businessName,
      phone: parsedData.phone,
      email: parsedData.email,
      address: parsedData.address,
      website: parsedData.website,
      otherInfo, // Set the other info
      date: new Date().toISOString().split('T')[0], // Get date part only in YYYY-MM-DD format
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }), // Format time in IST without seconds
    });

    
    // Save to the database
    await newExtractedInfo.save();

    // Send back the extracted information to the client
    res.json({ message: 'Data extracted and saved successfully', extractedText });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Something went wrong'  });
  }
});

app.get('/get-extracted-data', async (req, res) => {
  try {
    const data = await ExtractedInfo.findAll(); // Use the correct model name
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve data' });
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
