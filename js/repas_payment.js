(function(){
  try {
    const bgEl = document.querySelector('.inscriptions-fullscreen');
    if (bgEl) bgEl.style.backgroundImage = "url('../images/maison.jpg')";
  } catch(_) {}

  function asInt(v, def){
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : (def||0);
  }
  function parseParams(){
    const sp = new URLSearchParams(window.location.search);
    const q_poulet = asInt(sp.get('q_poulet'), 0);
    const q_saumon = asInt(sp.get('q_saumon'), 0);
    const q_vege = asInt(sp.get('q_vege'), 0);
    const qty = asInt(sp.get('qty'), q_poulet + q_saumon + q_vege);
    const amount = asInt(sp.get('amount'), qty * 15);
    const joursRaw = (sp.get('jours')||'').trim();
    const jours = joursRaw ? joursRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    return { q_poulet, q_saumon, q_vege, qty, amount, jours };
  }
  function flavorBreakdown(p){
    const parts = [];
    if (p.q_poulet>0) parts.push(`Poulet ×${p.q_poulet}`);
    if (p.q_saumon>0) parts.push(`Saumon ×${p.q_saumon}`);
    if (p.q_vege>0) parts.push(`Végé ×${p.q_vege}`);
    return parts.length ? parts.join(' • ') : 'Bowls';
  }
  function daysLine(p){
    return p.jours.length ? `Jour(s) de retrait: ${p.jours.join(', ')}` : '';
  }

  const state = parseParams();
  // Top summary
  const sumFormatEl = document.getElementById('payment-summary-format');
  const sumQtyEl = document.getElementById('payment-summary-qty');
  const sumPriceEl = document.getElementById('payment-summary-price');
  if (sumFormatEl) sumFormatEl.textContent = flavorBreakdown(state);
  if (sumQtyEl) sumQtyEl.textContent = String(state.qty || 0);
  if (sumPriceEl) sumPriceEl.textContent = String(state.amount || 0);

  // Detailed order box
  (function(){
    const listEl = document.getElementById('order-items-list');
    const daysEl = document.getElementById('order-days-line');
    const totalEl = document.getElementById('order-total-value');
    if (listEl) {
      const items = [];
      if (state.q_poulet > 0) items.push({ label: 'Poulet', qty: state.q_poulet });
      if (state.q_saumon > 0) items.push({ label: 'Saumon', qty: state.q_saumon });
      if (state.q_vege > 0) items.push({ label: 'Végé', qty: state.q_vege });
      if (items.length === 0) {
        listEl.innerHTML = '<li>Bowls</li>';
      } else {
        listEl.innerHTML = items.map(it => `<li><strong>${it.label}</strong> ×${it.qty}</li>`).join('');
      }
    }
    if (daysEl) daysEl.textContent = daysLine(state);
    if (totalEl) totalEl.textContent = String(state.amount || 0);
  })();

  // Method selection and details rendering
  const choices = document.querySelectorAll('.payment-choice-card');
  const detailsWrapper = document.querySelector('.payment-details-wrapper');
  const twintBox = document.getElementById('payment-details-twint');
  const bankBox = document.getElementById('payment-details-bank');
  function showMethod(method){
    if (!detailsWrapper) return;
    detailsWrapper.hidden = false;
    const isTwint = method === 'twint';
    if (twintBox) twintBox.hidden = !isTwint;
    if (bankBox) bankBox.hidden = isTwint;
    // Fill dynamic content
    const breakdown = flavorBreakdown(state);
    const days = daysLine(state);
    if (isTwint){
      const total = (state.amount||0) + 1; // +1 CHF fee
      const totalEl = document.getElementById('twint-total');
      const fmtEl = document.getElementById('twint-format');
      const extrasEl = document.getElementById('twint-extras');
      if (totalEl) totalEl.textContent = String(total);
      if (fmtEl) fmtEl.textContent = breakdown;
      if (extrasEl) extrasEl.textContent = days;
    } else {
      const totalEl = document.getElementById('bank-total');
      const fmtEl = document.getElementById('bank-format');
      const extrasEl = document.getElementById('bank-extras');
      if (totalEl) totalEl.textContent = String(state.amount||0);
      if (fmtEl) fmtEl.textContent = breakdown;
      if (extrasEl) extrasEl.textContent = days;
    }
  }
  choices.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const method = el.getAttribute('data-method');
      showMethod(method);
    });
    el.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const method = el.getAttribute('data-method');
        showMethod(method);
      }
    });
  });

})();
