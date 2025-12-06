(function () {
  // Fixed endpoint for bénévole form (provided by user).
  window.GOOGLE_SHEETS_WEB_APP_URL_BENEVOLE = 'https://script.google.com/macros/s/AKfycbzMht9QfBOU0fRqax7_t9W4PlDiTG6UBvA3Dzc8NTkjKluQxoNyiM7Cv-UGX3mcbb5n/exec';

  // Static background image (rive.jpg) instead of random carousel.
  try {
    const bgEl = document.querySelector('.benevoles-fullscreen');
    if (bgEl) bgEl.style.backgroundImage = "url('../images/rive.jpg')";
  } catch (e) {
    console.warn('Static background apply failed', e);
  }

  const form = document.getElementById('benevole-form');
  const btn = document.getElementById('submit-benevole');
  const successBox = document.getElementById('benevole-success');
  if (!form || !btn) return; // Safety

  function getSelectedShifts() {
    return Array.from(form.querySelectorAll('input[name="shifts[]"]:checked')).map(el => el.value);
  }

  function showSuccess() {
    form.reset();
    successBox && (successBox.hidden = false);
    if (successBox) {
      window.scrollTo({ top: successBox.offsetTop - 80, behavior: 'smooth' });
    }
  }

  btn.addEventListener('click', () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const shifts = getSelectedShifts();
    if (shifts.length === 0) {
      alert('Merci de sélectionner au moins un créneau.');
      return;
    }

    const fd = new FormData(form);
    const payload = {
      form_type: 'benevole',
      prenom: fd.get('prenom'),
      nom: fd.get('nom'),
      birthdate: fd.get('birthdate'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      tshirt: fd.get('tshirt'),
      comment: fd.get('comment') || '',
      raclette: fd.get('raclette') || '',
      photo_arrivee: fd.get('photo_arrivee') || '',
      shifts: shifts,
      submitted_at: new Date().toISOString(),
    };

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Envoi…';

    const url = window.GOOGLE_SHEETS_WEB_APP_URL_BENEVOLE || '';

    if (!url) {
      console.warn('GOOGLE_SHEETS_WEB_APP_URL_BENEVOLE manquant - passage direct au succès local');
      btn.disabled = false;
      btn.textContent = originalText;
      showSuccess();
      return;
    }

    const simpleReq = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
    };

    fetch(url, { ...simpleReq, mode: 'cors' })
      .then(() => {
        btn.disabled = false;
        btn.textContent = originalText;
        showSuccess();
      })
      .catch(() => {
        return fetch(url, { ...simpleReq, mode: 'no-cors' })
          .then(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            showSuccess();
          })
          .catch(err2 => {
            console.error("Echec d'envoi bénévoles", err2);
            btn.disabled = false;
            btn.textContent = originalText;
            alert("Impossible d'envoyer le formulaire pour l'instant. Merci de réessayer ou contactez-nous: backyardultravalais@gmail.com");
          });
      });
  });
})();
