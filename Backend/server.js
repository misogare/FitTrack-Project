import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workouts.js';
import mealRoutes from './routes/meals.js';
import goalRoutes from './routes/goals.js';
import planRoutes from './routes/plan.js';
import settingsRoutes from './routes/settings.js';
import nutritionRoutes from './routes/nutrition.js';
import foodRoutes from './routes/foods.js';
import bodyMetricRoutes from './routes/body-metrics.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow Vercel preview + production domains, plus local dev
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return callback(null, true);

    const explicit = process.env.FRONTEND_URL;
    if (explicit && origin === explicit) return callback(null, true);

    // Local dev
    if (origin.startsWith('http://localhost:')) return callback(null, true);

    // Vercel preview / production deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/body-metrics', bodyMetricRoutes);
// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FitTrack API running on http://localhost:${PORT}`);
});