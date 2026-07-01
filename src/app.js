const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const v2Routes = require('./routes/v2.routes');
const mobileRoutes = require('./routes/mobile.routes');
const driverMobileRoutes = require('./routes/driver.routes');
const { swaggerOptions } = require('./config/swagger');

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/uploads', express.static('uploads'));

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  swaggerOptions: { persistAuthorization: true },
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Deploy webhook — called by GitHub Actions instead of SSH
app.post('/api/deploy-hook', (req, res) => {
  const secret = req.query.secret || req.body?.secret;
  const expected = process.env.DEPLOY_SECRET || 'patria-deploy-2026';
  if (!secret || secret !== expected) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json({ message: 'Deploy started', timestamp: new Date().toISOString() });

  const { exec } = require('child_process');
  const token = process.env.GITHUB_TOKEN;
  const remote = token
    ? `https://${token}@github.com/asaid-cmd/patria-backend-1.git`
    : null;

  const gitCmd = remote
    ? `git -C /app remote set-url origin "${remote}" && git -C /app pull origin main`
    : `git -C /app pull origin main`;

  exec(gitCmd, (err, stdout, stderr) => {
    if (err) {
      console.error('[deploy-hook] git pull failed:', stderr || err.message);
    } else {
      console.log('[deploy-hook] git pull success:', stdout.trim());
      setTimeout(() => {
        console.log('[deploy-hook] restarting process to load new code...');
        process.exit(0);
      }, 1500);
    }
  });
});

app.use('/api', routes);
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
app.use('/api/v2', v2Routes);
app.use('/api/mobile/v2', v2Routes);   // Flutter uses /api/mobile as base URL prefix
app.use('/api/seed', require('./routes/seed.routes'));
app.use('/api/mobile', mobileRoutes);
// Support both /api/driver/* (Patria) and /api/drivers/* (ERB) paths
app.use('/api/driver', driverMobileRoutes);
app.use('/api/drivers', driverMobileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'الصفحة غير موجودة' });
});

app.use(errorHandler);

module.exports = app;
