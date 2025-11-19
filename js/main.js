console.log("JavaScript file is loaded correctly.")

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
});