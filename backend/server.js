const express = require('express');
const cors = require('cors');

const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const questionsRouter = require('./routes/questions');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Paladar backend running' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Paladar API is running',
    routes: ['/health', '/categories', '/questions/:categoryId', '/auth/register', '/auth/login']
  });
});

app.use('/auth', authRouter);
app.use('/categories', categoriesRouter);
app.use('/questions', questionsRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
