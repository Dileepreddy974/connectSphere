module.exports = {
  apps: [
    {
      name: 'connectsphere-backend',
      cwd: __dirname,
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      kill_timeout: 12000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
