/* Nova Flex — interactions & GSAP motion */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Map dots (positions from the Figma frame, relative to the map image) ---------- */
  const DOTS = [
    [494, 10700], [512, 10772], [416, 10595], [649, 10767], [453, 10731], [471, 10803], [375, 10626],
    [608, 10798], [472, 10649], [490, 10721], [394, 10544], [627, 10716], [545, 10708], [563, 10780],
    [467, 10603], [700, 10775], [486, 10760], [504, 10832], [408, 10655], [641, 10827], [383, 10674],
    [401, 10746], [305, 10569], [538, 10741], [472, 10836], [549, 10561], [394, 10731], [589, 10858],
  ];
  const dotsEl = $(".map__dots");
  DOTS.forEach(([x, y], i) => {
    const d = document.createElement("span");
    d.className = "map__dot";
    d.style.left = ((x + 4 + 84) / 1575) * 100 + "%";
    d.style.top = ((y + 4 - 10286) / 993) * 100 + "%";
    d.style.setProperty("--d", (i % 7) * 0.35 + "s");
    dotsEl.appendChild(d);
  });

  /* ---------- Split intro paragraph into words ---------- */
  $$(".split-words").forEach((el) => {
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w">${w}</span>`)
      .join(" ");
  });

  /* ---------- Mobile menu ---------- */
  const burger = $(".burger");
  const menu = $(".menu");
  const toggleMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
    if (window.gsap) {
      gsap.to(menu, { clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut" });
      if (open) gsap.fromTo($$("a", menu), { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, delay: 0.25, duration: 0.6, ease: "power3.out" });
    } else {
      menu.style.clipPath = open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)";
    }
  };
  burger.addEventListener("click", () => toggleMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Header state on scroll ---------- */
  const header = $(".header");
  let lastY = 0;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", y > 400 && y > lastY && !menu.classList.contains("is-open"));
    lastY = y;
  }, { passive: true });

  /* ---------- Form ---------- */
  const form = $(".form");
  const status = $(".form__status");
  const select = $("select", form);
  select.addEventListener("change", () => select.classList.toggle("has-value", !!select.value));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("input[required]", form).forEach((input) => {
      const bad = !input.value.trim() || (input.type === "email" && !/^\S+@\S+\.\S+$/.test(input.value));
      input.closest(".field").classList.toggle("is-invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) {
      status.textContent = "Please add your name and a valid email.";
      if (window.gsap) gsap.fromTo(".contact__panel", { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
      return;
    }
    status.textContent = "Thanks — your details are in. We’ll reply shortly.";
    form.reset();
    select.classList.remove("has-value");
  });
  $$("input", form).forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("is-invalid")));

  /* ---------- Active nav link ---------- */
  const navLinks = $$(".nav__link");
  const sections = ["services", "projects", "locations"].map((id) => document.getElementById(id));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => s && io.observe(s));

  /* ---------- Services: one active row (scroll position, or hover) ---------- */
  const svcList = $(".svc-list");
  const svcRows = $$(".svc", svcList);
  let hoverLock = false;
  const setActive = (row) => {
    if (!row || row.classList.contains("is-active")) return;
    svcRows.forEach((r) => r.classList.toggle("is-active", r === row));
    svcList.dispatchEvent(new CustomEvent("svc:active", { detail: { row } }));
  };
  const pickByScroll = () => {
    if (hoverLock) return;
    const mid = window.innerHeight * 0.5;
    let best = null, bestD = Infinity;
    svcRows.forEach((r) => {
      const b = r.getBoundingClientRect();
      const d = Math.abs(b.top + b.height * 0.4 - mid);
      if (d < bestD) { bestD = d; best = r; }
    });
    const list = svcList.getBoundingClientRect();
    if (list.bottom > 0 && list.top < window.innerHeight) setActive(best);
  };
  let svcTick = false;
  window.addEventListener("scroll", () => {
    if (svcTick) return;
    svcTick = true;
    requestAnimationFrame(() => { svcTick = false; pickByScroll(); });
  }, { passive: true });
  if (window.matchMedia("(hover: hover)").matches) {
    svcRows.forEach((r) => r.addEventListener("pointerenter", () => { hoverLock = true; setActive(r); }));
    svcList.addEventListener("pointerleave", () => { hoverLock = false; pickByScroll(); });
  }
  svcRows[0].classList.add("is-active");

  /* ---------- Without GSAP (or reduced motion) stop here ---------- */
  const loader = $(".loader");
  if (!window.gsap || reduced) {
    loader.remove();
    $$(".intro__text .w").forEach((w) => (w.style.opacity = 1));
    $$(".coverage tbody tr").forEach((tr) => ($(".bar i", tr).style.width = (tr.dataset.v / 7) * 100 + "%"));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.body.classList.add("is-loading");

  /* ---------- Intro loader → hero ---------- */
  gsap.set(".hero__title .line > span", { yPercent: 110 });
  gsap.set("[data-hero]", { y: 24, opacity: 0 });
  gsap.set([".brand", ".nav__link", ".burger"], { y: -20, opacity: 0 });
  gsap.set(".hero__scene", { scale: 1.25 });

  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".loader__mark", { scale: 0.6, opacity: 0, rotate: -12, duration: 0.9 })
    .to(".loader__bar span", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, "<0.1")
    .to(".loader__mark", { yPercent: -40, opacity: 0, duration: 0.6, ease: "power3.in" })
    .to(".loader__bar", { opacity: 0, duration: 0.3 }, "<")
    .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "-=0.15")
    .add(() => { document.body.classList.remove("is-loading"); loader.remove(); })
    .to(".hero__scene", { scale: 1.06, duration: 2.2 }, "<0.1")
    .to(".hero__title .line > span", { yPercent: 0, duration: 1.2, stagger: 0.12 }, "<0.35")
    .to("[data-hero]", { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, "<0.2")
    .to([".brand", ".nav__link", ".burger"], { y: 0, opacity: 1, duration: 0.9, stagger: 0.05 }, "<");
  // Never let the intro hold the page hostage (e.g. throttled background tabs)
  setTimeout(() => { if (intro.progress() < 1) intro.progress(1); }, 4500);

  /* ---------- Hero parallax ---------- */
  gsap.to(".hero__media", {
    yPercent: 18, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero__content", {
    y: -60, opacity: 0, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true },
  });

  /* ---------- Hero smoke: particles rising from the stacks ---------- */
  const hero = $(".hero");
  const heroImg = $(".hero__scene img");
  const canvas = $(".hero__smoke");
  const ctx = canvas.getContext("2d");
  // Stack tops as fractions of the source photo; w = how much smoke each one makes
  const STACKS = [
    { x: 0.340, y: 0.214, w: 1.0 },
    { x: 0.298, y: 0.330, w: 0.65 },
    { x: 0.383, y: 0.262, w: 0.45 },
    { x: 0.421, y: 0.336, w: 0.4 },
    { x: 0.152, y: 0.436, w: 0.35 },
    { x: 0.127, y: 0.484, w: 0.3 },
  ];
  const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, inside: false };
  const puffs = [];
  let W = 0, H = 0, dpr = 1, fit = { s: 1, ox: 0, oy: 0 }, running = false;

  // Pre-rendered soft, lumpy smoke sprites
  const sprites = [0, 1, 2].map(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    for (let i = 0; i < 7; i++) {
      const bx = 64 + gsap.utils.random(-22, 22), by = 64 + gsap.utils.random(-22, 22), br = gsap.utils.random(26, 44);
      const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, "rgba(190, 212, 226, 0.2)");
      grad.addColorStop(1, "rgba(190, 212, 226, 0)");
      g.fillStyle = grad;
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }
    return c;
  });

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = canvas.offsetWidth; H = canvas.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Same maths as object-fit: cover, so emitters stay locked to the photo
    const iw = heroImg.naturalWidth || 1672, ih = heroImg.naturalHeight || 1099;
    const s = Math.max(W / iw, H / ih);
    fit = { s, ox: (W - iw * s) / 2, oy: (H - ih * s) / 2, iw, ih };
  };
  const stackPos = (st) => ({ x: fit.ox + st.x * fit.iw * fit.s, y: fit.oy + st.y * fit.ih * fit.s });

  const spawn = (st, boost = 1) => {
    const p = stackPos(st);
    const k = fit.s * 1.6; // scale with the photo
    puffs.push({
      x: p.x + gsap.utils.random(-3, 3) * k, y: p.y,
      vx: gsap.utils.random(4, 14) * k, vy: -gsap.utils.random(28, 46) * k * boost,
      r: gsap.utils.random(8, 14) * k * (0.6 + st.w * 0.5), grow: gsap.utils.random(14, 24) * k,
      rot: Math.random() * Math.PI * 2, spin: gsap.utils.random(-0.4, 0.4),
      age: 0, life: gsap.utils.random(3.8, 6), a: gsap.utils.random(0.4, 0.7) * (0.45 + st.w * 0.55),
      img: sprites[(Math.random() * sprites.length) | 0], seed: Math.random() * 100,
    });
  };

  const acc = STACKS.map(() => 0);
  let t = 0;
  const tick = (time, deltaMs) => {
    const dt = Math.min(deltaMs, 50) / 1000;
    t += dt;
    STACKS.forEach((st, i) => {
      // Hovering near a stack makes it puff harder
      const sp = stackPos(st);
      const near = pointer.inside ? Math.max(0, 1 - Math.hypot(pointer.x - sp.x, pointer.y - sp.y) / 180) : 0;
      acc[i] += dt * st.w * (6 + near * 26);
      while (acc[i] >= 1) { acc[i] -= 1; spawn(st, 1 + near * 0.8); }
    });
    ctx.clearRect(0, 0, W, H);
    const wind = 10 + Math.sin(t * 0.35) * 8;
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age >= p.life) { puffs.splice(i, 1); continue; }
      const k = p.age / p.life;
      // turbulence + wind, slowing as the plume rises
      p.vx += (wind * fit.s + Math.sin(t * 1.3 + p.seed) * 14 * fit.s - p.vx * 0.4) * dt;
      p.vy *= 1 - 0.35 * dt;
      // the cursor pushes smoke away like a breeze
      if (pointer.inside) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy);
        if (d < 150 && d > 0.1) {
          const f = (1 - d / 150) * 900 * dt;
          p.vx += (dx / d) * f + pointer.vx * 0.04;
          p.vy += (dy / d) * f + pointer.vy * 0.04;
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.r += p.grow * dt; p.rot += p.spin * dt;
      const alpha = p.a * (k < 0.12 ? k / 0.12 : 1 - Math.pow((k - 0.12) / 0.88, 1.4));
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.img, -p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };
  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    on ? gsap.ticker.add(tick) : gsap.ticker.remove(tick);
  };
  resize();
  heroImg.complete ? resize() : heroImg.addEventListener("load", resize);
  window.addEventListener("resize", resize);
  // Pre-warm so the plumes are already up when the loader lifts
  for (let n = 0; n < 220; n++) tick(0, 33);
  ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top", onToggle: (self) => setRunning(self.isActive) });
  setRunning(true);

  /* ---------- Hero hover: depth parallax, flashlight, smoke wind ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    const light = $(".hero__light");
    const sx = gsap.quickTo(".hero__scene", "x", { duration: 1.2, ease: "power3" });
    const sy = gsap.quickTo(".hero__scene", "y", { duration: 1.2, ease: "power3" });
    const tx = gsap.quickTo(".hero__title", "x", { duration: 1.2, ease: "power3" });
    const ty = gsap.quickTo(".hero__title", "y", { duration: 1.2, ease: "power3" });
    const lx = gsap.quickTo(light, "--lx", { duration: 0.6, ease: "power3" });
    const ly = gsap.quickTo(light, "--ly", { duration: 0.6, ease: "power3" });
    let last = null;
    hero.addEventListener("pointerenter", () => hero.classList.add("is-hover"));
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      sx(-nx * 36); sy(-ny * 22);
      tx(nx * 14); ty(ny * 8);
      lx(((e.clientX - r.left) / r.width) * 100);
      ly(((e.clientY - r.top) / r.height) * 100);
      // pointer in canvas space (canvas sits inside the moving, scaled scene)
      const c = canvas.getBoundingClientRect();
      const px = ((e.clientX - c.left) / c.width) * W, py = ((e.clientY - c.top) / c.height) * H;
      if (last) { pointer.vx = (px - last.x) * 30; pointer.vy = (py - last.y) * 30; }
      last = { x: px, y: py };
      pointer.x = px; pointer.y = py; pointer.inside = true;
    });
    hero.addEventListener("pointerleave", () => {
      hero.classList.remove("is-hover");
      sx(0); sy(0); tx(0); ty(0);
      pointer.inside = false; last = null;
    });
    gsap.set(light, { "--lx": 50, "--ly": 40 });
  }

  /* ---------- Generic reveal ---------- */
  $$(".reveal-up").forEach((el) => {
    gsap.from(el, {
      y: 50, opacity: 0, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });
  gsap.from(".regions__title .line > span", {
    yPercent: 110, duration: 1.2, stagger: 0.12, ease: "expo.out",
    scrollTrigger: { trigger: ".regions__title", start: "top 85%" },
  });

  /* ---------- Stats: bg parallax, card rise, counters ---------- */
  gsap.fromTo(".stats__bg img", { yPercent: -15 }, {
    yPercent: 0, ease: "none",
    scrollTrigger: { trigger: ".stats", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.from(".stats__card", {
    y: 120, opacity: 0, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".stats__card", start: "top 90%" },
  });
  $$(".stat").forEach((stat, i) => {
    const num = $(".stat__num", stat);
    const target = +num.dataset.count;
    const o = { v: 0 };
    num.textContent = "0";
    gsap.timeline({ scrollTrigger: { trigger: ".stats__card", start: "top 70%" } })
      .from(stat, { y: 40, opacity: 0, duration: 1, ease: "expo.out", delay: i * 0.1 })
      .to(o, {
        v: target, duration: 1.8, ease: "power3.out",
        onUpdate: () => (num.textContent = Math.round(o.v)),
      }, "<");
  });

  /* ---------- Intro: logo assemble + word-by-word light-up ---------- */
  gsap.timeline({ scrollTrigger: { trigger: ".intro__logo", start: "top 80%" } })
    .from(".intro__mark", { xPercent: -40, rotate: -25, opacity: 0, duration: 1.3, ease: "expo.out" })
    .from(".intro__word", { clipPath: "inset(0 100% 0 0)", duration: 1.3, ease: "expo.inOut" }, "<0.15")
    .from(".intro__kicker", { y: 30, opacity: 0, duration: 1, ease: "expo.out" }, "<0.4");
  gsap.to(".intro__text .w", {
    opacity: 1, stagger: 0.05, ease: "none",
    scrollTrigger: { trigger: ".intro__text", start: "top 80%", end: "bottom 45%", scrub: true },
  });
  gsap.to(".intro .pattern", {
    backgroundPosition: "50% 80%", ease: "none",
    scrollTrigger: { trigger: ".intro", start: "top bottom", end: "bottom top", scrub: true },
  });

  /* ---------- Services: entrance, rail dot, cursor glow ---------- */
  gsap.set(".svc", { opacity: 0, y: 60 });
  ScrollTrigger.batch(".svc", {
    start: "top 90%", once: true,
    onEnter: (rows) => gsap.to(rows, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }),
  });
  gsap.from(".svc-rail", {
    scaleY: 0, transformOrigin: "50% 0", duration: 1.6, ease: "expo.inOut",
    scrollTrigger: { trigger: ".svc-list", start: "top 80%" },
  });
  const railTo = (row) => {
    if (!row) return;
    const y = row.offsetTop + Math.min(64, row.offsetHeight * 0.3);
    gsap.to(".svc-rail__dot", { y, duration: 0.9, ease: "expo.out", overwrite: true });
    gsap.to(".svc-rail__fill", { height: y, duration: 0.9, ease: "expo.out", overwrite: true });
  };
  svcList.addEventListener("svc:active", (e) => railTo(e.detail.row));
  railTo($(".svc.is-active"));
  ScrollTrigger.addEventListener("refresh", () => railTo($(".svc.is-active")));
  $$(".svc").forEach((row) => {
    gsap.fromTo($(".svc__img img", row), { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
  if (window.matchMedia("(hover: hover)").matches) {
    const svcSection = $(".services");
    const glow = $(".services__glow");
    const gx = gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3" });
    const gy = gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3" });
    svcSection.addEventListener("pointerenter", () => gsap.to(glow, { opacity: 1, duration: 0.6 }));
    svcSection.addEventListener("pointerleave", () => gsap.to(glow, { opacity: 0, duration: 0.6 }));
    svcSection.addEventListener("pointermove", (e) => {
      const r = svcSection.getBoundingClientRect();
      gx(e.clientX - r.left); gy(e.clientY - r.top);
    });
  }

  /* ---------- Projects: stacking cards ---------- */
  const cards = $$(".project");
  cards.forEach((card, i) => {
    gsap.from(card, {
      y: 100, opacity: 0, duration: 1.1, ease: "expo.out",
      scrollTrigger: { trigger: card, start: "top 92%" },
    });
    gsap.from([$(".project__brand img", card)], {
      scale: 0.8, opacity: 0, duration: 1, ease: "back.out(2)",
      scrollTrigger: { trigger: card, start: "top 75%" },
    });
    if (i === cards.length - 1) return;
    gsap.to(card, {
      scale: 0.92 - (cards.length - i) * 0.01, filter: "brightness(0.55)", ease: "none",
      scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 20%", scrub: true },
    });
  });

  /* ---------- We got it covered: zoom through the N into the next section ---------- */
  const doorMark = $(".door__mark");
  const FOCUS = { x: 15.8 / 68.64, y: 20 / 32.54 }; // a point inside the N's left stroke
  const narrow = () => window.innerWidth < 700;
  const ORBIT = [[-0.30, -0.27], [0.30, -0.27], [-0.38, 0.03], [0.38, 0.03], [-0.24, 0.30], [0.24, 0.30]];
  const ORBIT_SM = [[-0.26, -0.29], [0.26, -0.29], [-0.26, 0.29], [0.26, 0.29], null, null];
  const orbit = (i) => (narrow() ? ORBIT_SM : ORBIT)[i];
  // measured at scale 1, so pin refreshes stay correct
  let door = {};
  const measureDoor = () => {
    gsap.set(doorMark, { clearProps: "transform" });
    const r = doorMark.getBoundingClientRect();
    const st = $(".door__stage").getBoundingClientRect();
    const fx = r.left - st.left + FOCUS.x * r.width;
    const fy = r.top - st.top + FOCUS.y * r.height;
    const diag = Math.hypot(st.width, st.height);
    door = { dx: st.width / 2 - fx, dy: st.height / 2 - fy, s: (diag * 1.4) / (0.2 * r.width) };
    gsap.set(doorMark, { transformOrigin: `${FOCUS.x * 100}% ${FOCUS.y * 100}%` });
  };
  gsap.set(".door__shot, .door__hero", { xPercent: -50, yPercent: -50, scale: 0.34, opacity: 0 });
  gsap.set(".door__text", { xPercent: -50, yPercent: -50, x: 0, y: 0 });
  ScrollTrigger.addEventListener("refreshInit", measureDoor);
  measureDoor();

  // Entrance as the section scrolls in (props not touched by the pinned timeline)
  gsap.timeline({ scrollTrigger: { trigger: ".door__stage", start: "top 85%", end: "top 15%", scrub: 0.6 } })
    .fromTo(".covered__word--l", { xPercent: -60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out" }, 0)
    .fromTo(".covered__word--r", { xPercent: 60, opacity: 0 }, { xPercent: 0, opacity: 1, ease: "power2.out" }, 0)
    .fromTo(doorMark, { rotate: -25, opacity: 0 }, { rotate: 0, opacity: 1, ease: "power2.out" }, 0);

  // Pinned: zoom through the N, open the scene, fan the shots out
  const ir = { immediateRender: false };
  gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".door__stage", start: "top top", end: () => "+=" + window.innerHeight * 3,
      pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
    },
  })
    .fromTo(".covered__word--l", { x: 0 }, { x: () => -window.innerWidth * 0.6, duration: 0.3, ease: "power2.in" }, 0.04)
    .fromTo(".covered__word--r", { x: 0 }, { x: () => window.innerWidth * 0.6, duration: 0.3, ease: "power2.in" }, 0.04)
    .fromTo(".covered__word > span", { opacity: 1 }, { opacity: 0, duration: 0.24, ...ir }, 0.08)
    .fromTo(doorMark, { x: 0, y: 0, scale: 1 }, { x: () => door.dx, y: () => door.dy, scale: () => door.s, duration: 0.34, ease: "power3.in" }, 0.04)
    .fromTo(".door__canvas", { opacity: 0 }, { opacity: 1, duration: 0.03, ...ir }, 0.35)
    .fromTo(".door__zoom", { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, ...ir }, 0.39)
    .fromTo(".door__hero", { opacity: 0, scale: 0.34 }, { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out", ...ir }, 0.4)
    .fromTo(".door__shot", { opacity: 0, scale: 0.34, x: 0, y: 0, rotate: 0 }, {
      opacity: (i) => (orbit(i) ? 1 : 0), scale: 1,
      x: (i) => (orbit(i) ? orbit(i)[0] * window.innerWidth : 0),
      y: (i) => (orbit(i) ? orbit(i)[1] * window.innerHeight : 0),
      rotate: (i) => [-4, 3, -2, 4, 3, -3][i],
      duration: 0.26, stagger: 0.025, ease: "power3.out", ...ir,
    }, 0.52)
    .fromTo(".door__hero", { scale: 1, opacity: 1 }, { scale: 0.6, opacity: 0, duration: 0.12, ease: "power2.in", ...ir }, 0.56)
    .fromTo(".door__text", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out", ...ir }, 0.66)
    .to({}, { duration: 0.2 });

  /* ---------- Why cards: staggered entrance + cursor glow ---------- */
  gsap.from(".why-card", {
    y: 80, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
    scrollTrigger: { trigger: ".why__grid", start: "top 85%" },
  });
  // cursor glow inside each card
  $$(".why-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------- Map: zoom, dots pop, coverage bars ---------- */
  gsap.fromTo(".map__img", { scale: 1.15 }, {
    scale: 1, ease: "none",
    scrollTrigger: { trigger: ".map", start: "top bottom", end: "center center", scrub: true },
  });
  gsap.from(".map__dot", {
    scale: 0, opacity: 0, duration: 0.6, ease: "back.out(3)",
    stagger: { each: 0.035, from: "random" },
    scrollTrigger: { trigger: ".map", start: "top 60%" },
  });
  gsap.timeline({ scrollTrigger: { trigger: ".coverage", start: "top 80%" } })
    .from(".coverage", { x: 80, opacity: 0, duration: 1.2, ease: "expo.out" })
    .from(".coverage tr", { opacity: 0, y: 10, stagger: 0.06, duration: 0.6, ease: "power2.out" }, "<0.3")
    .add(() => {
      $$(".coverage tbody tr").forEach((tr, i) => {
        gsap.to($(".bar i", tr), { width: (tr.dataset.v / 7) * 100 + "%", duration: 1.2, delay: i * 0.08, ease: "expo.out" });
      });
    }, "<0.2");

  /* ---------- Contact ---------- */
  gsap.timeline({ scrollTrigger: { trigger: ".contact__panel", start: "top 80%" } })
    .from(".contact__panel", { clipPath: "inset(12% 8% 12% 8%)", opacity: 0, duration: 1.3, ease: "expo.out" })
    .from(".contact__title", { y: 60, opacity: 0, duration: 1.1, ease: "expo.out" }, "<0.2")
    .from(".form .field", { y: 30, opacity: 0, stagger: 0.07, duration: 0.9, ease: "expo.out" }, "<0.15")
    .from(".form__foot, .form__privacy", { opacity: 0, y: 20, duration: 0.8 }, "<0.3");
  gsap.from(".contact__cta", {
    y: 80, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".contact__cta", start: "top 95%" },
  });

  /* ---------- Footer ---------- */
  gsap.from(".footer__intro > *, .footer__links > *", {
    y: 30, opacity: 0, duration: 1, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: ".footer", start: "top 85%" },
  });
  gsap.timeline({ scrollTrigger: { trigger: ".footer__logo", start: "top bottom", end: "bottom bottom", scrub: 1 } })
    .from(".footer__mark", { yPercent: 70, rotate: -8 })
    .from(".footer__word", { yPercent: 90 }, "<0.05");

  /* ---------- Magnetic buttons ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    $$(".magnetic").forEach((btn) => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Smooth in-page anchors (respecting fixed header) ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2 && id !== "#") return;
      const target = id === "#" || id === "#top" ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
