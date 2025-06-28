import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import rulesetRoutes from './routes/ruleset-routes';
import { globalErrorHandler, notFoundHandler, setupProcessErrorHandlers } from './middleware/error-handler';

dotenv.config();

// Setup process-level error handlers
setupProcessErrorHandlers();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rulesets', rulesetRoutes);

// Simple routes
app.get('/', (req, res) => {
  res.json({ message: 'Mitigation Rules Engine API - Hello World!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler for unmatched routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization', error);
    process.exit(1);
  }); 