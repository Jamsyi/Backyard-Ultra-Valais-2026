console.log("JavaScript file is loaded correctly.")

// CONFIG: Set your deployed Google Apps Script Web App URL here
// Example: const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby3MvEKMPdH2f0r-WZ7mkndA0PhyKU2xs9GLNVu0PEIXjNmicb06DOPBCWEUT05yg7oGA/exec';

// Detect header ASAP to prevent navbar flash
const pageHeader = document.querySelector('.page-header');
const heroHeader = document.querySelector('.hero');
const headerElement = pageHeader || heroHeader;
if (headerElement) {
    document.body.classList.add('has-header');
}

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const hamburgerButton = document.querySelector('.hamburger-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenuButton = document.querySelector('.close-menu-button');

    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            hamburgerButton.classList.toggle('active');
        });
    }

    if (closeMenuButton && mobileMenu) {
        closeMenuButton.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            if (hamburgerButton) {
                hamburgerButton.classList.remove('active');
            }
        });
    }

    // Handle mobile menu dropdowns
    if (mobileMenu) {
        const mobileMenuParentLinks = mobileMenu.querySelectorAll('.parent-link');
        console.log('Found parent links:', mobileMenuParentLinks.length);
        mobileMenuParentLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const parentLi = link.closest('li');
                const wasOpen = parentLi.classList.contains('open');
                console.log('Before toggle - was open:', wasOpen);
                
                // Toggle current dropdown
                if (wasOpen) {
                    parentLi.classList.remove('open');
                } else {
                    parentLi.classList.add('open');
                }
                console.log('After toggle - is open:', parentLi.classList.contains('open'));
            });
        });
    }

    let lastScrollY = window.scrollY;
    let scrollTimeout;

    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
            const currentScrollY = window.scrollY;

            // Only allow hide/show behavior AFTER header zone (when body.scrolled is true)
            const canHide = document.body.classList.contains('scrolled');
            if (canHide) {
                if (currentScrollY > lastScrollY) {
                    navbar.classList.add('hidden');
                } else {
                    navbar.classList.remove('hidden');
                }
            } else {
                // Ensure visible while in image header zone
                navbar.classList.remove('hidden');
            }

            // Toggle scrolled state for transparent navbar logic
            if (headerElement) {
                const threshold = headerElement.offsetHeight - navbar.offsetHeight;
                if (currentScrollY > threshold) {
                    document.body.classList.add('scrolled');
                } else {
                    document.body.classList.remove('scrolled');
                }
            }

            lastScrollY = currentScrollY;
        }, 16);
    });

    function equalizeFormatHeights() {
        const cards = document.querySelectorAll('.formats-grid .format-card');
        if (!cards || cards.length < 2) return;

        cards.forEach(card => card.style.height = '');

        let explorerCard = Array.from(cards).find(card => {
            const img = card.querySelector('img');
            if (!img) return false;
            const alt = (img.alt || '').toLowerCase();
            const src = (img.getAttribute('src') || '').toLowerCase();
            return alt.includes('explorer') || src.includes('explorer');
        });

        if (!explorerCard) explorerCard = cards[1];

        const infinityCard = Array.from(cards).find(card => {
            const img = card.querySelector('img');
            if (!img) return false;
            const alt = (img.alt || '').toLowerCase();
            const src = (img.getAttribute('src') || '').toLowerCase();
            return alt.includes('infinity') || src.includes('infinity');
        }) || cards[0];


        const explorerHeight = explorerCard.getBoundingClientRect().height;
        if (explorerHeight && infinityCard) {
            infinityCard.style.height = `${Math.ceil(explorerHeight)}px`;
        }
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(equalizeFormatHeights, 120);
    });

    setTimeout(equalizeFormatHeights, 80);


    try {
        // Mobile/Small screens: tap to toggle with curtain animation
        const submenuAnchors = document.querySelectorAll('.main-menu .has-submenu > a');
        submenuAnchors.forEach(anchor => {
            anchor.setAttribute('aria-haspopup', 'true');
            anchor.setAttribute('aria-expanded', 'false');

            anchor.addEventListener('click', (e) => {
                const parentLi = anchor.parentElement;
                const dropdown = parentLi.querySelector('.dropdown-menu');
                e.preventDefault();

                const inMobile = mobileMenu.classList.contains('active') || window.innerWidth <= 960;
                if (!inMobile) return; // desktop uses hover

                if (!parentLi.classList.contains('open')) {
                    // Open: remove any closing state and expand
                    if (dropdown) dropdown.classList.remove('closing');
                    parentLi.classList.add('open');
                    anchor.setAttribute('aria-expanded', 'true');
                } else {
                    // Close: add closing class and wait for transition end
                    if (dropdown) {
                        dropdown.classList.remove('closing');
                        void dropdown.offsetWidth; // force reflow to restart transition
                        dropdown.classList.add('closing');
                        const handler = (ev) => {
                            if (ev.propertyName !== 'transform') return;
                            parentLi.classList.remove('open');
                            dropdown.classList.remove('closing');
                            anchor.setAttribute('aria-expanded', 'false');
                            dropdown.removeEventListener('transitionend', handler);
                        };
                        dropdown.addEventListener('transitionend', handler);
                    } else {
                        parentLi.classList.remove('open');
                        anchor.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    } catch (err) {
        console.warn('Could not initialize mobile submenu toggles', err);
    }


    try {
        // Desktop: hover to open; on leave, animate close (curtain bottom->top)
        const desktopSubmenus = document.querySelectorAll('.main-menu .has-submenu');
        desktopSubmenus.forEach(li => {
            const anchor = li.querySelector('a');
            let hideTimeout = null;

            li.addEventListener('mouseenter', () => {
                if (window.innerWidth <= 960) return;
                if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
                li.classList.add('open');
                const dropdown = li.querySelector('.dropdown-menu');
                if (dropdown) dropdown.classList.remove('closing');
                if (anchor) anchor.setAttribute('aria-expanded', 'true');
            });

            li.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 960) return;
                hideTimeout = setTimeout(() => {
                    const dropdown = li.querySelector('.dropdown-menu');
                    if (dropdown) {
                        dropdown.classList.remove('closing');
                        void dropdown.offsetWidth; // restart transition
                        dropdown.classList.add('closing');
                        const handler = (ev) => {
                            if (ev.propertyName !== 'transform') return;
                            li.classList.remove('open');
                            dropdown.classList.remove('closing');
                            if (anchor) anchor.setAttribute('aria-expanded', 'false');
                            dropdown.removeEventListener('transitionend', handler);
                        };
                        dropdown.addEventListener('transitionend', handler);
                    } else {
                        li.classList.remove('open');
                        if (anchor) anchor.setAttribute('aria-expanded', 'false');
                    }
                }, 120); // small delay to allow pointer travel
            });
        });
    } catch (err) {
        console.warn('Could not add desktop submenu hover delays', err);
    }

    // Dynamic accent colors for inscription format cards (extract dominant average from image)
    try {
        const cards = document.querySelectorAll('.inscription-format[data-img]');
        if (cards.length) {
            cards.forEach(card => {
                const src = card.getAttribute('data-img');
                if (!src) return;
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.src = src;
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const w = 40, h = 40;
                        canvas.width = w; canvas.height = h;
                        ctx.drawImage(img, 0, 0, w, h);
                        const data = ctx.getImageData(0,0,w,h).data;
                        let r=0,g=0,b=0,count=0;
                        for (let i=0;i<data.length;i+=4) {
                            const rr=data[i], gg=data[i+1], bb=data[i+2], aa=data[i+3];
                            if (aa < 120) continue; // skip very transparent
                            r+=rr; g+=gg; b+=bb; count++;
                        }
                        if (count) { r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count); }
                        // Slight vibrance boost
                        const boost = 1.15;
                        r=Math.min(255, Math.round(r*boost));
                        g=Math.min(255, Math.round(g*boost));
                        b=Math.min(255, Math.round(b*boost));
                        const accent = `rgb(${r}, ${g}, ${b})`;
                        card.style.setProperty('--accent', accent);
                    } catch (e) {
                        console.warn('Accent extraction failed', e);
                    }
                };
                img.onerror = () => {
                    console.warn('Could not load image for accent', src);
                };
            });
        }
    } catch (err) {
        console.warn('Dynamic accent color initialization failed', err);
    }

    // Swap to registration form on format click
    try {
        const formatCards = document.querySelectorAll('.inscription-format');
        const formWrapper = document.querySelector('.registration-form-wrapper');
        const formatsWrapper = document.querySelector('.formats-wrapper');
        const soonNote = document.querySelector('.soon-note');
        const formatLabelSpan = document.querySelector('.selected-format-label');
        const hiddenFormatInput = document.getElementById('selected-format-input');
        const backBtn = document.querySelector('.back-to-formats');
            const parentalRow = document.getElementById('parental-upload-row');
            const parentalInput = document.getElementById('parental_doc');

        function showForm(formatName) {
            if (!formWrapper || !formatsWrapper) return;
            formatsWrapper.setAttribute('hidden','');
            soonNote && soonNote.setAttribute('hidden','');
            formWrapper.hidden = false;
            formatLabelSpan.textContent = formatName.toUpperCase();
            hiddenFormatInput.value = formatName;
        }

        function showFormats() {
            if (!formWrapper || !formatsWrapper) return;
            formWrapper.hidden = true;
            formatsWrapper.removeAttribute('hidden');
            soonNote && soonNote.removeAttribute('hidden');
            hiddenFormatInput.value = '';
            formatLabelSpan.textContent = '';
        }

        formatCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const title = card.querySelector('h2');
                if (!title) return;
                showForm(title.textContent.trim());
            });
            card.removeAttribute('aria-disabled'); // allow interaction now
        });

        backBtn && backBtn.addEventListener('click', () => showFormats());

        // Basic client validation (still passive since form inactive)
        const form = document.getElementById('inscription-form');
        if (form) {
                // Birthdate minor detection
                const birthdateInput = form.querySelector('#birthdate');
                function updateMinorState() {
                    if (!birthdateInput || !parentalRow || !parentalInput) return;
                    const val = birthdateInput.value;
                    if (!val) {
                        parentalRow.hidden = true;
                        parentalInput.removeAttribute('required');
                        return;
                    }
                    const dob = new Date(val);
                    const now = new Date();
                    let age = now.getFullYear() - dob.getFullYear();
                    const m = now.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
                        age--;
                    }
                    const isMinor = age < 18;
                    parentalRow.hidden = !isMinor;
                    if (isMinor) {
                        parentalInput.setAttribute('required','');
                    } else {
                        parentalInput.removeAttribute('required');
                    }
                }
                birthdateInput && birthdateInput.addEventListener('change', updateMinorState);
                birthdateInput && birthdateInput.addEventListener('input', updateMinorState);
                // Initialize once in case of prefilled values
                updateMinorState();
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const requiredFields = form.querySelectorAll('[required]');
                let valid = true;
                requiredFields.forEach(f => {
                    let fieldValid = true;
                    if (f.type === 'radio') {
                        // At least one radio in the group must be checked
                        const groupName = f.name;
                        fieldValid = !!form.querySelector(`input[name="${groupName}"]:checked`);
                    } else if (f.type === 'checkbox') {
                        fieldValid = !!f.checked;
                        } else if (f.type === 'file') {
                            fieldValid = f.files && f.files.length > 0;
                    } else {
                        fieldValid = !!f.value;
                    }

                    if (!fieldValid) {
                        valid = false;
                        f.classList.add('invalid');
                    } else {
                        f.classList.remove('invalid');
                    }
                });
                // Honeypot: if filled, silently succeed
                const hp = form.querySelector('input[name="website"]');
                if (hp && hp.value) {
                    showFakeSuccess();
                    return;
                }

                if (!valid) {
                    alert('Veuillez compléter tous les champs obligatoires.');
                    return;
                }

                const submitBtn = form.querySelector('.submit-btn');
                const prevText = submitBtn ? submitBtn.textContent : '';
                if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi…'; }

                // If no GAS URL configured, keep passive behavior
                if (!GOOGLE_SHEETS_WEB_APP_URL) {
                    alert('Destinataire Google Sheets non configuré. Partage-moi l\'URL Apps Script pour l\'activer.');
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = prevText; }
                    return;
                }

                // Build multipart FormData to allow file upload to GAS
                const fd = new FormData(form);
                // Add explicit consent flag
                const consent = form.querySelector('#agree-rules')?.checked ? 'yes' : 'no';
                fd.set('agree_rules', consent);

                // Also compose an email for buv.inscription@gmail.com (client-side mailto fallback)
                try {
                    const fields = {
                        format: fd.get('format') || '',
                        prenom: fd.get('prenom') || '',
                        nom: fd.get('nom') || '',
                        email: fd.get('email') || '',
                        birthdate: fd.get('birthdate') || '',
                        genre: fd.get('genre') || '',
                        tshirt: fd.get('tshirt') || '',
                    };
                    const subject = `Inscription Backyard Ultra Valais - ${fields.format || 'Format'}`;
                    const lines = [
                        `Format: ${fields.format}`,
                        `Prénom: ${fields.prenom}`,
                        `Nom: ${fields.nom}`,
                        `Email: ${fields.email}`,
                        `Date de naissance: ${fields.birthdate}`,
                        `Genre: ${fields.genre}`,
                        `T-shirt: ${fields.tshirt}`,
                        '',
                        `Règlement lu: ${form.querySelector('#agree-rules')?.checked ? 'Oui' : 'Non'}`,
                    ];
                    const body = encodeURIComponent(lines.join('\n'));
                    const mailto = `mailto:buv.inscription@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
                    // Open email client for sending (attachments cannot be added via mailto)
                    window.location.href = mailto;
                } catch (e) {
                    console.warn('Could not construct mailto', e);
                }

                // If GAS URL configured, also post data for server-side email/record (handles attachment)
                if (GOOGLE_SHEETS_WEB_APP_URL) {
                    fetch(GOOGLE_SHEETS_WEB_APP_URL, {
                        method: 'POST',
                        // Do NOT set Content-Type; let browser set multipart boundary
                        body: fd,
                        mode: 'no-cors'
                    }).then(() => {
                        showFakeSuccess();
                    }).catch(() => {
                        console.warn('GAS submission failed');
                    }).finally(() => {
                        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = prevText; }
                    });
                } else {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = prevText; }
                }

                function showFakeSuccess() {
                    const wrapper = document.querySelector('.registration-form-wrapper');
                    if (!wrapper) return;
                    wrapper.innerHTML = `
                        <h2 class="form-title">Merci !</h2>
                        <p>Votre demande d'inscription a été transmise. Vous recevrez une confirmation par e-mail dès l'ouverture officielle.</p>
                        <button type="button" class="back-to-formats" onclick="location.reload()">← Retour</button>
                    `;
                }
            });
            // If GAS configured, make button look active
            if (GOOGLE_SHEETS_WEB_APP_URL) {
                const submitBtn = form.querySelector('.submit-btn');
                if (submitBtn) submitBtn.style.cursor = 'pointer';
            }
        }
    } catch (err) {
        console.warn('Could not initialize format->form swap', err);
    }
});