document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. NAVBAR scroll effect
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // 2. HAMBURGER toggle
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(6px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) closeMobileMenu();
  });

  // 3. SCROLL REVEAL
  const revealEls = document.querySelectorAll('.reveal, .catalogue-item, .contact-block');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = Array.from(entry.target.parentNode.children);
        const delay = Math.min(siblings.indexOf(entry.target) * 80, 500);
        if (reduceMotion) {
          entry.target.classList.add('visible');
        } else {
          setTimeout(() => entry.target.classList.add('visible'), delay);
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // 4. Subtle hero parallax (disabled when reduced motion is preferred)
  const heroBgText = document.querySelector('.hero-bg-text');
  if (heroBgText && !reduceMotion) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroHeight = document.querySelector('.hero').offsetHeight;
      if (scrollY < heroHeight) {
        heroBgText.style.transform = `translateY(${scrollY * 0.35}px) scale(${1 + scrollY * 0.0002})`;
      }
    }, { passive: true });
  }

  // 5. SMOOTH SCROLL
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight, behavior: 'smooth' });
      }
    });
  });


  // 7. REACH OUT FORM — FormSubmit AJAX
  const reachOutForm = document.getElementById('reachOutForm');
  const reachOutSubmit = document.getElementById('reachOutSubmit');
  const reachOutStatus = document.getElementById('reachOutStatus');

  if (reachOutForm && reachOutSubmit && reachOutStatus) {
    const emailField = document.getElementById('reachOutEmail');
    const messageField = document.getElementById('reachOutMessage');
    const submitLabel = reachOutSubmit.querySelector('.reach-out-submit-label');

    const setFormStatus = (message, state = '') => {
      reachOutStatus.textContent = message;
      if (state) {
        reachOutStatus.dataset.state = state;
      } else {
        delete reachOutStatus.dataset.state;
      }
    };

    const validateField = (field) => {
      const valid = field.checkValidity();
      field.setAttribute('aria-invalid', String(!valid));
      return valid;
    };

    [emailField, messageField].forEach((field) => {
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
          field.setAttribute('aria-invalid', 'false');
        }
      });
    });

    reachOutForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const emailValid = validateField(emailField);
      const messageValid = validateField(messageField);

      if (!emailValid || !messageValid) {
        setFormStatus('Please enter a valid email address and your message.', 'error');
        reachOutForm.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      if (reachOutSubmit.disabled) return;

      reachOutSubmit.disabled = true;
      reachOutForm.setAttribute('aria-busy', 'true');
      submitLabel.textContent = 'SENDING…';
      setFormStatus('Sending your message securely…');

      try {
        const standardEndpoint = reachOutForm.action;
        const ajaxEndpoint = standardEndpoint.replace(
          'https://formsubmit.co/',
          'https://formsubmit.co/ajax/'
        );

        const payload = Object.fromEntries(new FormData(reachOutForm).entries());
        const response = await fetch(ajaxEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        let result;
        try {
          result = await response.json();
        } catch {
          throw new Error('The form service returned an unexpected response. Please try again.');
        }

        if (!response.ok || result.success === false || result.error) {
          throw new Error(
            result.message ||
            result.error?.message ||
            'Your message could not be sent. Please try again in a moment.'
          );
        }

        reachOutForm.reset();
        [emailField, messageField].forEach((field) => field.setAttribute('aria-invalid', 'false'));
        setFormStatus('Thank you — your message has been submitted. We’ll be in touch soon.', 'success');
      } catch (error) {
        setFormStatus(
          error instanceof TypeError
            ? 'We couldn’t connect to the form service. Please check your connection and try again.'
            : (error.message || 'Something went wrong. Please try again.'),
          'error'
        );
      } finally {
        reachOutSubmit.disabled = false;
        reachOutForm.removeAttribute('aria-busy');
        submitLabel.textContent = 'SEND MESSAGE';
      }
    });
  }

  // 6. MARQUEE pause on hover
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
    marqueeTrack.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
  }

});

// 8. Close mobile menu (global)
function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  if (!mobileMenu) return;
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = '';
  spans[1].style.opacity = '';
  spans[2].style.transform = '';
}
