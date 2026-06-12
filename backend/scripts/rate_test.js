/* Small smoke test to exercise HTTP rate limiter */
const url = 'http://localhost:5000/api';
const total = 120;
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  for (let i = 1; i <= total; i++) {
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`${i}: ${res.status}`);
    } catch (err) {
      console.log(`${i}: ERROR ${err.message}`);
    }
    await delay(50);
  }
  console.log('Done');
})();
