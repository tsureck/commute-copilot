import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import decisionRoutes from './routes/decision';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/decision', decisionRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚂 Commute Copilot API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Demo mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
});

export default app;
