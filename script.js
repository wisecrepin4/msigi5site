(function () {
  'use strict';

  /* ---------------- header scroll state ---------------- */
  var header = document.getElementById('site-header');
  function onHeaderScroll() {
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  onHeaderScroll();
  window.addEventListener('scroll', onHeaderScroll, { passive: true });

  /* ---------------- mobile menu ---------------- */
  var menuOpenBtn = document.getElementById('menu-open');
  var menuCloseBtn = document.getElementById('menu-close');
  var mobileMenu = document.getElementById('mobile-menu');

  function openMenu() {
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuOpenBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuOpenBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }
  menuOpenBtn.addEventListener('click', openMenu);
  menuCloseBtn.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) closeMenu();
  });

  /* ---------------- active nav link on scroll ---------------- */
  var navLinks = document.querySelectorAll('[data-nav-link]');
  var sections = ['home', 'about', 'companies', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', isActive);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNav(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------------- pinned scroll: companies (stacking cards) ---------------- */
  var pinWrap = document.getElementById('pin-wrap');
  var pinTrack = document.getElementById('pin-track');
  var progressWrap = document.getElementById('pin-progress');

  if (pinWrap && pinTrack) {
    var cards = Array.prototype.slice.call(pinTrack.querySelectorAll('.company-card'));
    var progressBtns = progressWrap ? Array.prototype.slice.call(progressWrap.querySelectorAll('button')) : [];
    var cardCount = cards.length;
    var segments = Math.max(1, cardCount - 1);
    var pinActive = false;
    var currentTop = 0;
    var ticking = false;

    function clamp01(n) { return Math.min(1, Math.max(0, n)); }

    function sizePinWrap() {
      pinWrap.style.height = (cardCount * window.innerHeight) + 'px';
    }

    function setActiveDot(index) {
      if (index === currentTop) return;
      currentTop = index;
      progressBtns.forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
      });
    }

    // Cards stack: card 0 sits still underneath; each following card
    // slides up from below and comes to rest fully covering the one
    // before it, scrubbed 1:1 with scroll position.
    function updateOnScroll() {
      ticking = false;
      if (!pinActive) return;
      var rect = pinWrap.getBoundingClientRect();
      var scrollable = pinWrap.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var progress = clamp01(-rect.top / scrollable);
      var topIndex = 0;

      for (var i = 0; i < cardCount; i++) {
        if (i === 0) {
          cards[i].classList.add('is-active');
          continue;
        }
        var segStart = (i - 1) / segments;
        var segEnd = i / segments;
        var t = clamp01((progress - segStart) / (segEnd - segStart));
        cards[i].style.transform = 'translateY(' + (1 - t) * 100 + '%)';
        cards[i].classList.toggle('is-active', t >= 1);
        if (t >= 0.999) topIndex = i;
      }
      setActiveDot(topIndex);
    }

    function requestTick() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateOnScroll);
      }
    }

    function enablePin() {
      pinActive = true;
      sizePinWrap();
      updateOnScroll();
    }
    enablePin();

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', function () {
      if (pinActive) sizePinWrap();
    });

    progressBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (!pinActive) return;
        var scrollable = pinWrap.offsetHeight - window.innerHeight;
        var wrapTop = pinWrap.getBoundingClientRect().top + window.scrollY;
        var targetProgress = i / segments;
        window.scrollTo({ top: wrapTop + scrollable * targetProgress + 1, behavior: 'smooth' });
      });
    });
  }

  /* ---------------- contact form (mailto compose) ---------------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('cf-name').value.trim();
      var email = document.getElementById('cf-email').value.trim();
      var company = document.getElementById('cf-company').value.trim();
      var message = document.getElementById('cf-message').value.trim();

      if (!name || !email || !message) {
        status.textContent = 'Please fill in your name, email, and message.';
        return;
      }

      var subject = encodeURIComponent('Enquiry from ' + name + (company ? ' — ' + company : ''));
      var bodyLines = [
        message,
        '',
        '—',
        'Name: ' + name,
        'Email: ' + email
      ];
      if (company) bodyLines.push('Company / interest: ' + company);
      var body = encodeURIComponent(bodyLines.join('\n'));

      window.location.href = 'mailto:info@msigi5s.com?subject=' + subject + '&body=' + body;
      status.textContent = 'Opening your email client to send this enquiry…';
    });
  }
})();
