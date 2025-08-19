import express from 'express';
import cors from 'cors';
import path from 'path';
import datasetRoutes from './routes/dataset';
import trainRoutes from './routes/train';
import metricsRoutes from './routes/metrics';
import predictRoutes from './routes/predict';
import { connect } from './db';
import * as dotenv from 'dotenv';

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/datasets', datasetRoutes);
app.use('/train', trainRoutes);
app.use('/metrics', metricsRoutes);
app.use('/predict', predictRoutes);

const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'annservice';

if (require.main === module) {
  connect(mongoUrl, dbName)
    .then(() => {
      app.listen(port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on port ${port}`);
      });
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error('Failed to connect to MongoDB', err);
    });
}
