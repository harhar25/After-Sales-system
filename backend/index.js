const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(require('./routes/croRoutes'));
app.use(require('./routes/saRoutes'));
app.use(require('./routes/jobRoutes'));
app.use(require('./routes/technicianRoutes'));
app.use(require('./routes/partsRoutes'));
app.use(require('./routes/foremanRoutes'));
app.use(require('./routes/cashierRoutes'));
app.use(require('./routes/securityRoutes'));
app.use(require('./routes/generalRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});