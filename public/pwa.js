const status = document.querySelector('#offline-status');

function showNotice(message) {
  status.textContent = message;
  status.hidden = !message;
}

async function prepareOffline() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    showNotice('Offline practice needs a supported browser and a secure (HTTPS) address.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    const updateNotice = () => {
      if (registration.waiting) showNotice('An update is ready. Close all Multiply windows and reopen to use it. Your statistics will stay saved.');
    };
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', updateNotice);
    });
    const installing = registration.installing;
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => {
        if (!installing) return;
        const checkState = () => {
          if (installing.state === 'redundant') reject(new Error('Offline assets could not be cached'));
        };
        installing.addEventListener('statechange', checkState);
        checkState();
      }),
    ]);
    showNotice('');
    updateNotice();
  } catch {
    showNotice('Offline setup could not finish. You can practise online; reopen while connected to try again.');
  }
}

prepareOffline();
