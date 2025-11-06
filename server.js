const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const User = require('./models/User');
const Eleveur = require('./models/Eleveur');
const Client = require('./models/Client');
const Lapin = require('./models/Lapin');
const { generateToken } = require('./utils/token');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Autoriser uniquement ton front
const allowedOrigins = [
  'https://monlapinci.com',
  'https://www.monlapinci.com',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lapins', require('./routes/lapins'));
app.use('/api/commandes', require('./routes/commandes')); // ← 
app.use('/api/newsletter', require('./routes/newsletter'));

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API Lapin Business - Backend Opérationnel!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      lapins: '/api/lapins', 
      commandes: '/api/commandes',
      newsletter: '/api/newsletter'
    }
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});




const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log('\n📋 Endpoints disponibles:');
  console.log('   🔐 Auth:      /api/auth');
  console.log('   🐇 Lapins:    /api/lapins');
  console.log('   📦 Commandes: /api/commandes');
  console.log('   📧 Newsletter:/api/newsletter');
});
