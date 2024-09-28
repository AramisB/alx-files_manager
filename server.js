import express from 'express';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/', routes);

app.listen(PORT, () => {
  console.log('Server started on port 5000');
});

export default app;
