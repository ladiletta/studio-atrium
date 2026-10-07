// Eleven small jobs the pages share. The site still works without this file:
// the menu opens, the forms check themselves, the year says what the HTML says,
// the carousels scroll, the nav over the hero stays on top of it, nothing waits
// to be revealed, and a photo or video link simply opens the photo or video.

// Readers whose system asks for less motion get no reveals, no counting and no
// smooth scrolling from this file.
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. THE PHONE MENU is a <details>, which opens with no script. This adds
//    closing it when you tap away or press Escape.
document.addEventListener('click', (event) => {
  document.querySelectorAll('details.dropdown[open]').forEach((menu) => {
    if (!menu.contains(event.target)) menu.removeAttribute('open');
  });
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('details.dropdown[open]').forEach((menu) => {
    menu.removeAttribute('open');
    menu.querySelector('summary').focus();
  });
});

// 2. THE FOOTER YEAR keeps itself current.
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// 3. DEMO FORMS show their thank-you message ([data-sent]) instead of sending.
//    To make one real, give the <form> an action and delete data-demo.
document.querySelectorAll('form[data-demo]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    form.reset();
    const sent = form.querySelector('[data-sent]');
    if (sent) {
      sent.hidden = false;
      sent.focus(); // role="status" plus focus: a screen reader hears it too
    }
  });
});

// 4. CAROUSELS ([data-carousel]) swipe and scroll with no script; their buttons
//    stay hidden until this file shows them. It adds arrows that move the
//    carousel and not the page, one dot per slide, and, given data-autoplay (in
//    milliseconds), turning that stops for a hover, a focus or the pause button.
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel');
  const slides = [...track.children];
  const controls = carousel.querySelector('[data-carousel-controls]');
  const dots = carousel.querySelector('[data-dots]');
  const pause = carousel.querySelector('[data-pause]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!controls || slides.length < 2) return;
  controls.hidden = false;

  const at = () => {
    const left = track.scrollLeft;
    return slides.reduce((best, s, i) => (Math.abs(s.offsetLeft - left) < Math.abs(slides[best].offsetLeft - left) ? i : best), 0);
  };
  // The last slide that can sit at the left edge: a row of cards ends before its last card does.
  const last = () => slides.findIndex((s) => s.offsetLeft >= track.scrollWidth - track.clientWidth - 1);
  const go = (i) => {
    const end = last() === -1 ? slides.length - 1 : last();
    const n = i > end ? 0 : i < 0 ? end : i;
    track.scrollTo({ left: slides[n].offsetLeft, behavior: still ? 'auto' : 'smooth' });
  };
  carousel.querySelector('[data-prev]')?.addEventListener('click', () => go(at() - 1));
  carousel.querySelector('[data-next]')?.addEventListener('click', () => go(at() + 1));

  // One dot per place the row can stop: three cards in view means two fewer.
  let buttons = [];
  const paint = () => buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === at())));
  const build = () => {
    const stops = (last() === -1 ? slides.length - 1 : last()) + 1;
    if (stops === buttons.length) return paint();
    dots?.replaceChildren();
    buttons = slides.slice(0, stops).map((slide, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel-dot';
      b.setAttribute('aria-label', `Slide ${i + 1} of ${stops}`);
      b.addEventListener('click', () => go(i));
      dots?.append(b);
      return b;
    });
    paint();
  };
  track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
  addEventListener('resize', build);
  build();

  const every = Number(carousel.dataset.autoplay);
  if (!every || still) {
    if (pause) pause.hidden = true;
    return;
  }
  let stopped = false;
  let held = false;
  setInterval(() => stopped || held || document.hidden || go(at() + 1), every);
  carousel.addEventListener('pointerenter', () => (held = true));
  carousel.addEventListener('pointerleave', () => (held = false));
  carousel.addEventListener('focusin', () => (held = true));
  carousel.addEventListener('focusout', () => (held = false));
  pause?.addEventListener('click', () => {
    stopped = !stopped;
    pause.setAttribute('aria-pressed', String(stopped));
    pause.setAttribute('aria-label', stopped ? 'Play the slides' : 'Pause the slides');
  });
});

// 5. THE NAV OVER THE HERO ([data-nav-over]) is see-through on the photo and
//    turns solid once the photo has scrolled up under it. With no script it sits
//    on the hero and scrolls away with it.
document.querySelectorAll('[data-nav-over]').forEach((nav) => {
  const hero = document.querySelector('[data-nav-under]');
  nav.classList.add('is-fixed');
  const paint = () => nav.classList.toggle('is-solid', scrollY > (hero?.offsetHeight ?? 0) - nav.offsetHeight);
  addEventListener('scroll', paint, { passive: true });
  paint();
});

// 6. THE STICKY NAV ([data-sticky-nav]) casts a shadow once the page scrolls
//    under it.
document.querySelectorAll('[data-sticky-nav]').forEach((nav) => {
  const paint = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', paint, { passive: true });
  paint();
});

// 7. REVEALS ([data-reveal]) fade up as they scroll into view, once. Nothing is
//    hidden until this runs. Several arriving together come in one after
//    another. Once one has played, its attribute goes, so its own hover effects
//    work as before.
const reveals = document.querySelectorAll('[data-reveal]');
if (reveals.length && !calm && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('reveal-on');
  const done = (event) => {
    const el = event.currentTarget;
    if (event.target !== el) return; // a transition inside it, not its own
    el.removeEventListener('transitionend', done);
    el.removeAttribute('data-reveal');
    el.classList.remove('is-revealed');
    el.style.removeProperty('--reveal-delay');
  };
  const watcher = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          const el = entry.target;
          watcher.unobserve(el);
          el.style.setProperty('--reveal-delay', `${i * 90}ms`);
          el.addEventListener('transitionend', done);
          el.classList.add('is-revealed');
        });
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  reveals.forEach((el) => watcher.observe(el));
}

// 8. NUMBERS THAT COUNT UP ([data-count]) climb from zero to the number in their
//    own text the first time they are seen: "12", "1,200" and "40+" all work.
//    "00" stays "00", because a placeholder has nothing to count to.
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !calm && 'IntersectionObserver' in window) {
  const count = (el) => {
    const text = el.textContent.trim();
    const match = text.match(/\d[\d,]*/);
    const target = match ? Number(match[0].replace(/,/g, '')) : 0;
    if (!target) return;
    const html = el.innerHTML;
    const shown = document.createElement('span');
    const said = document.createElement('span');
    shown.setAttribute('aria-hidden', 'true');
    said.className = 'sr-only';
    said.textContent = text; // a screen reader hears the real number, once
    el.replaceChildren(shown, said);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 1600, 1);
      const n = Math.round(target * (1 - (1 - t) ** 3)); // fast, then easing in
      shown.textContent = text.replace(match[0], match[0].includes(',') ? n.toLocaleString('en-US') : n);
      if (t < 1) requestAnimationFrame(step);
      else el.innerHTML = html;
    };
    requestAnimationFrame(step);
  };
  const watcher = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        watcher.unobserve(entry.target);
        count(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  counters.forEach((el) => watcher.observe(el));
}

// 9. BACK TO TOP ([data-to-top]) appears once you have scrolled most of a
//    screen, and its ring fills as you read down the page. From the keyboard it
//    hands focus to the skip link, the first thing on the page.
const toTop = document.querySelector('[data-to-top]');
if (toTop) {
  toTop.hidden = false;
  const paint = () => {
    const room = document.documentElement.scrollHeight - innerHeight;
    toTop.style.setProperty('--progress', room > 0 ? Math.min(scrollY / room, 1).toFixed(3) : '0');
    toTop.classList.toggle('is-shown', scrollY > innerHeight * 0.8);
  };
  toTop.addEventListener('click', (event) => {
    event.preventDefault();
    const keyboard = toTop.matches(':focus-visible');
    scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    if (keyboard) document.querySelector('.skip-link')?.focus({ preventScroll: true });
  });
  addEventListener('scroll', paint, { passive: true });
  paint();
}

// 10. THE MENU'S JUMP LINKS ([data-spy]) underline the course on screen, and on
//     a phone slide sideways to keep that link in view.
document.querySelectorAll('[data-spy]').forEach((nav) => {
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const row = links[0]?.closest('ul');
  const pairs = links.map((a) => [a, document.getElementById(a.hash.slice(1))]).filter(([, section]) => section);
  let current = null;
  const paint = () => {
    const line = nav.getBoundingClientRect().bottom + 24;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    const passed = pairs.filter(([, section]) => section.getBoundingClientRect().top <= line);
    const link = (atEnd ? pairs.at(-1) : passed.at(-1))?.[0] ?? null;
    if (link === current) return;
    current?.removeAttribute('aria-current');
    link?.setAttribute('aria-current', 'true');
    current = link;
    if (!link || !row) return;
    const offset = link.getBoundingClientRect().left - row.getBoundingClientRect().left;
    row.scrollTo({ left: row.scrollLeft + offset - (row.clientWidth - link.offsetWidth) / 2, behavior: calm ? 'auto' : 'smooth' });
  };
  addEventListener('scroll', paint, { passive: true });
  paint();
});

// 11. THE LIGHTBOX. Every link inside [data-lightbox] is a photo: it opens large
//     over the page, with arrows to the others in the same group. A link marked
//     data-video-popup plays its YouTube video there instead of leaving the
//     page. Escape, the close button or a click beside the picture closes it.
//     The viewer is a <dialog>, built the first time somebody opens a photo.
{
  // In braces, so these names stay inside this job.
  let viewer = null;
  let group = [];
  let at = 0;

  const icon = (d) =>
    `<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  // The video's id and the second to start from, from a youtube.com/watch?v=
  // or youtu.be/ link. ?t=90 starts it at a minute and a half.
  const youtube = (href) => {
    const url = new URL(href, location.href);
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
    return { id, start: parseInt(url.searchParams.get('t'), 10) || 0 };
  };

  const buildViewer = () => {
    viewer = document.createElement('dialog');
    viewer.className = 'lightbox';
    viewer.setAttribute('aria-label', 'Photo viewer');
    viewer.innerHTML = `
      <div class="lightbox-stage" data-lb-stage></div>
      <div class="lightbox-bar">
        <p class="text-sm font-semibold" data-lb-count></p>
        <button class="btn btn-circle btn-ghost text-white" type="button" data-lb-close aria-label="Close">${icon('M18 6 6 18M6 6l12 12')}</button>
      </div>
      <button class="lightbox-arrow btn btn-circle" type="button" data-lb-prev aria-label="Previous photo">${icon('m15 18-6-6 6-6')}</button>
      <button class="lightbox-arrow btn btn-circle" type="button" data-lb-next aria-label="Next photo">${icon('m9 18 6-6-6-6')}</button>`;
    document.body.append(viewer);
    viewer.querySelector('[data-lb-close]').addEventListener('click', () => viewer.close());
    viewer.querySelector('[data-lb-prev]').addEventListener('click', () => show(at - 1));
    viewer.querySelector('[data-lb-next]').addEventListener('click', () => show(at + 1));
    viewer.addEventListener('click', (event) => {
      if (!event.target.closest('figure, button')) viewer.close(); // a click beside the picture
    });
    viewer.addEventListener('keydown', (event) => {
      if (group.length < 2) return;
      if (event.key === 'ArrowLeft') show(at - 1);
      if (event.key === 'ArrowRight') show(at + 1);
    });
    // Emptying the stage stops a video; focus goes back to the link that opened it.
    viewer.addEventListener('close', () => {
      viewer.querySelector('[data-lb-stage]').replaceChildren();
      group[at]?.focus();
    });
  };

  const show = (i) => {
    at = (i + group.length) % group.length;
    const link = group[at];
    const figure = document.createElement('figure');
    if (link.matches('[data-video-popup]')) {
      const frame = document.createElement('iframe');
      frame.className = 'lightbox-video';
      const { id, start } = youtube(link.href);
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&start=${start}`;
      frame.title = link.getAttribute('aria-label') || link.textContent.trim() || 'Video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      figure.append(frame);
    } else {
      const thumb = link.querySelector('img');
      const img = document.createElement('img');
      img.src = link.href;
      img.alt = thumb?.alt ?? '';
      figure.append(img);
      const words = link.dataset.caption || thumb?.alt;
      if (words) {
        const caption = document.createElement('figcaption');
        caption.textContent = words;
        if (words === img.alt) caption.setAttribute('aria-hidden', 'true'); // said once, not twice
        figure.append(caption);
      }
    }
    viewer.querySelector('[data-lb-stage]').replaceChildren(figure);
    const many = group.length > 1;
    viewer.querySelector('[data-lb-prev]').hidden = !many;
    viewer.querySelector('[data-lb-next]').hidden = !many;
    viewer.querySelector('[data-lb-count]').textContent = many ? `${at + 1} / ${group.length}` : '';
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-lightbox] a[href], a[data-video-popup]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return; // a new tab is still a new tab
    event.preventDefault();
    if (!viewer) buildViewer();
    const box = link.closest('[data-lightbox]');
    group = box ? [...box.querySelectorAll('a[href]')] : [link];
    show(group.indexOf(link));
    viewer.showModal();
  });
}
