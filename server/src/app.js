const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { clientUrl, isProd } = require('./config/env');
const { requireSameOrigin } = require('./middleware/csrf');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const reviewRoutes = require('./routes/review.routes');
const merchantRoutes = require('./routes/merchant.routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Behind Vercel's proxy: needed for secure cookies and per-client rate limiting.
if (isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(requireSameOrigin);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/products/:id/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/merchant', merchantRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
