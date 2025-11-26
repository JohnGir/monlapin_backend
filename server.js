// server.js - GARDER /api/orders POUR LE FRONTEND
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  'https://monlapinci.com',
  'https://www.monlapinci.com',
  'http://localhost:3000',
  'http://localhost:8081',
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

// 🔥 CORRECTION : Gardez /api/orders pour le frontend existant
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lapins', require('./routes/lapins'));
app.use('/api/orders', require('./routes/orders')); // ⬅️ GARDER POUR LE FRONTEND
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/categories', require('./routes/categories'));

// SUPPRIMEZ cette ligne si elle existe :
// app.use('/api/commandes', require('./routes/commandes'));

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
      orders: '/api/orders', // ⬅️ Coherent avec le frontend
      newsletter: '/api/newsletter',
      categories: '/api/categories'
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
  console.log('\n📋 Endpoints disponibles:');
  console.log('   🔐 Auth:      /api/auth');
  console.log('   🐇 Lapins:    /api/lapins');
  console.log('   📦 Orders:    /api/orders'); // ⬅️ Coherent
  console.log('   📧 Newsletter:/api/newsletter');
  console.log('   🗂️ Categories:/api/categories');
});