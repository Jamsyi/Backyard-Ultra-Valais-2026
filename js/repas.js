(function () {
  // Endpoint placeholder for bowl orders (set if/when available)
  window.GOOGLE_SHEETS_WEB_APP_URL_REPAS = window.GOOGLE_SHEETS_WEB_APP_URL_REPAS || '';

  // Background tailored for repas page
  try {
    const bgEl = document.querySelector('.benevoles-fullscreen');
    if (bgEl) bgEl.style.backgroundImage = "url('../images/maison.jpg')";
  } catch (e) {
    console.warn('Static background apply failed', e);
  }

  const form = document.getElementById('repas-form');
  const btn = document.getElementById('submit-repas');
  const bypassBtn = document.getElementById('bypass-repas');
  const successBox = document.getElementById('repas-success');
  const qtyP = document.getElementById('qty-p');
  const qtyS = document.getElementById('qty-s');
  const qtyV = document.getElementById('qty-v');
  const incP = document.getElementById('qty-p-inc');
  const decP = document.getElementById('qty-p-dec');
  const incS = document.getElementById('qty-s-inc');
  const decS = document.getElementById('qty-s-dec');
  const incV = document.getElementById('qty-v-inc');
  const decV = document.getElementById('qty-v-dec');
  const totalPreview = document.getElementById('repas-total-preview');
  if (!form || !btn) return;

  function valInt(el){
    const raw = el ? el.value : '0';
    const n = Number(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }

  function updateTotalPreview() {
    if (!totalPreview) return;
    const sum = valInt(qtyP) + valInt(qtyS) + valInt(qtyV);
    totalPreview.textContent = String(sum * 15);
  }
  [qtyP, qtyS, qtyV].forEach(el => el && el.addEventListener('input', updateTotalPreview));
  updateTotalPreview();

  function clampQty(n) {
    const v = Math.floor(Number(n) || 1);
    return v < 1 ? 1 : v;
  }
  function clampQtyZero(n){
    const v = Math.floor(Number(n) || 0);
    return v < 0 ? 0 : v;
  }
  function bindStepper(inputEl, incEl, decEl){
    if (!inputEl) return;
    incEl && incEl.addEventListener('click', () => {
      const current = clampQtyZero(inputEl.value);
      inputEl.value = String(current + 1);
      updateTotalPreview();
    });
    decEl && decEl.addEventListener('click', () => {
      const current = clampQtyZero(inputEl.value);
      inputEl.value = String(Math.max(0, current - 1));
      updateTotalPreview();
    });
  }
  bindStepper(qtyP, incP, decP);
  bindStepper(qtyS, incS, decS);
  bindStepper(qtyV, incV, decV);

  function getSelectedDays() {
    return Array.from(form.querySelectorAll('input[name="jours[]"]:checked')).map(el => el.value);
  }

  function showSuccess(amount, qty) {
    if (typeof amount !== 'undefined' && amount !== null) {
      const amtEl = document.getElementById('repas-amount-value');
      if (amtEl) amtEl.textContent = String(amount);
    }
    if (typeof qty !== 'undefined' && qty !== null) {
      const qtyEl = document.getElementById('repas-qty-value');
      if (qtyEl) qtyEl.textContent = String(qty);
    }
    form.reset();
    successBox && (successBox.hidden = false);
    if (successBox) {
      window.scrollTo({ top: successBox.offsetTop - 80, behavior: 'smooth' });
    }
  }

  btn.addEventListener('click', () => {
    console.log('[repas] Submit clicked');
    const prevText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi…';
    if (!form.checkValidity()) {
      form.reportValidity();
      btn.disabled = false;
      btn.textContent = prevText;
      return;
    }

    const jours = getSelectedDays();
    if (jours.length === 0) {
      alert('Merci de sélectionner au moins un jour.');
      btn.disabled = false;
      btn.textContent = prevText;
      return;
    }

    const fd = new FormData(form);
    const qP = valInt(qtyP);
    const qS = valInt(qtyS);
    const qV = valInt(qtyV);
    const qty = qP + qS + qV;
    if (qty < 1) {
      alert('Merci d\'indiquer au moins un bowl.');
      btn.disabled = false;
      btn.textContent = prevText;
      return;
    }
    const amountVal = qty * 15;
    // Build URL-encoded payload (proven reliable with GAS)
    const paramsLog = new URLSearchParams();
    paramsLog.set('form_type', 'repas');
    paramsLog.set('prenom', String(fd.get('prenom') || ''));
    paramsLog.set('nom', String(fd.get('nom') || ''));
    paramsLog.set('email', String(fd.get('email') || ''));
    paramsLog.set('phone', String(fd.get('phone') || ''));
    paramsLog.set('jours', jours.join(','));
    paramsLog.set('qty_poulet', String(qP));
    paramsLog.set('qty_saumon', String(qS));
    paramsLog.set('qty_vege', String(qV));
    paramsLog.set('qty', String(qty));
    paramsLog.set('amount', String(amountVal));
    paramsLog.set('submitted_at', new Date().toISOString());

    const gasUrl = (typeof window.GOOGLE_SHEETS_WEB_APP_URL_REPAS !== 'undefined' && window.GOOGLE_SHEETS_WEB_APP_URL_REPAS)
      || (typeof window.GOOGLE_SHEETS_WEB_APP_URL !== 'undefined' && window.GOOGLE_SHEETS_WEB_APP_URL)
      || '';
    if (!gasUrl) {
      console.warn('[repas] GAS URL missing, skipping server log');
    } else {
      console.log('[repas] Posting (urlencoded) to GAS URL:', gasUrl);
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: paramsLog.toString(),
        mode: 'no-cors'
      }).then(() => {
        console.log('[repas] Urlencoded dispatch complete');
      }).catch(() => {
        console.warn('[repas] Urlencoded dispatch failed');
      });
    }
    const params = new URLSearchParams({
      qty: String(qty),
      amount: String(amountVal),
      q_poulet: String(qP),
      q_saumon: String(qS),
      q_vege: String(qV),
      jours: getSelectedDays().join(','),
    });
    // Brief delay to let beacon/fetch queue and provide feedback
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = prevText;
      window.location.href = 'paiement.html?' + params.toString();
    }, 300);
  });

  // Bypass: skip validations and proceed with defaults
  bypassBtn && bypassBtn.addEventListener('click', () => {
    console.log('[repas] Bypass clicked');
    const prevText = bypassBtn.textContent;
    bypassBtn.disabled = true;
    bypassBtn.textContent = 'Envoi…';
    const qP = valInt(qtyP);
    const qS = valInt(qtyS);
    const qV = valInt(qtyV);
    const qty = qP + qS + qV || 1; // default to 1 if all zeros
    const amountVal = qty * 15;
    // Fire-and-forget log as well on bypass
    const jours = getSelectedDays();
    // Build URL-encoded payload for bypass
    const paramsBypass = new URLSearchParams();
    paramsBypass.set('form_type', 'repas');
    paramsBypass.set('prenom', (document.getElementById('prenom') || {}).value || '');
    paramsBypass.set('nom', (document.getElementById('nom') || {}).value || '');
    paramsBypass.set('email', (document.getElementById('email') || {}).value || '');
    paramsBypass.set('phone', (document.getElementById('phone') || {}).value || '');
    paramsBypass.set('jours', jours.join(','));
    paramsBypass.set('qty_poulet', String(qP));
    paramsBypass.set('qty_saumon', String(qS));
    paramsBypass.set('qty_vege', String(qV));
    paramsBypass.set('qty', String(qty));
    paramsBypass.set('amount', String(amountVal));
    paramsBypass.set('submitted_at', new Date().toISOString());
    const gasUrl = (typeof window.GOOGLE_SHEETS_WEB_APP_URL_REPAS !== 'undefined' && window.GOOGLE_SHEETS_WEB_APP_URL_REPAS)
      || (typeof window.GOOGLE_SHEETS_WEB_APP_URL !== 'undefined' && window.GOOGLE_SHEETS_WEB_APP_URL)
      || '';
    if (!gasUrl) {
      console.warn('[repas] GAS URL missing, skipping server log (bypass)');
    } else {
      console.log('[repas] Posting (urlencoded) to GAS URL (bypass):', gasUrl);
      fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: paramsBypass.toString(),
        mode: 'no-cors'
      }).then(() => {
        console.log('[repas] Urlencoded dispatch complete (bypass)');
      }).catch(() => {
        console.warn('[repas] Urlencoded dispatch failed (bypass)');
      });
    }
    const params = new URLSearchParams({
      qty: String(qty),
      amount: String(amountVal),
      q_poulet: String(qP),
      q_saumon: String(qS),
      q_vege: String(qV),
      jours: getSelectedDays().join(','),
    });
    setTimeout(() => {
      bypassBtn.disabled = false;
      bypassBtn.textContent = prevText;
      window.location.href = 'paiement.html?' + params.toString();
    }, 300);
  });
})();
