const form = document.getElementById('scan-form');
const progress = document.getElementById('progress');
const resultPre = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dir = document.getElementById('dir').value;
  progress.textContent = 'Scanning...';
  resultPre.textContent = '';
  try {
    const res = await fetch('/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: dir })
    });
    const data = await res.json();
    progress.textContent = 'Finished.';
    resultPre.textContent = data.log.join('\n') + '\n\n' +
      JSON.stringify(data.result, null, 2);
  } catch (err) {
    progress.textContent = 'Error: ' + err.message;
  }
});
