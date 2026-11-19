import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Wedding Photo-Sharing Server running on port ${PORT}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(` Frontend URL: ${config.frontendUrl}`);
  console.log(` Health check: http://localhost:${PORT}/api/public/health`);
  console.log(`===============================================`);
});
