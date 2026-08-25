process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

try {
  await import('./server/app.js');
  console.log('Server module loaded successfully');
} catch (err) {
  console.error('FAILED TO START:', err);
}
