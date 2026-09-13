/* ============================================================
   IVAN FULVIAN PITOYO — PORTFOLIO
   Renders content.json into the DOM, then wires up:
   - scroll-reveal animations (IntersectionObserver)
   - hero load-in sequence
   - smooth in-page scrolling with fixed-nav offset
   - scroll-spy active nav state
   - Contact Me -> opens Gmail compose directly
   - mobile nav toggle, progress bar, back-to-top
   ============================================================ */

(function () {
  "use strict";

  const NAV_H = 77; // px, keep in sync with --nav-h + progress bar in style.css
  const state = { content: null };

  /* ---------- tiny DOM helper ---------- */
  function el(tag, opts) {
    const node = document.createElement(tag);
    opts = opts || {};
    if (opts.class) node.className = opts.class;
    if (opts.text) node.textContent = opts.text;
    if (opts.html !== undefined) node.innerHTML = opts.html;
    if (opts.attrs) {
      Object.keys(opts.attrs).forEach((k) => node.setAttribute(k, opts.attrs[k]));
    }
    return node;
  }

  function gmailComposeUrl(email, subject, body) {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: email,
      su: subject,
      body: body,
    });
    return "https://mail.google.com/mail/?" + params.toString();
  }

  function openContactCompose(email) {
    const url = gmailComposeUrl(
      email,
      "Portfolio Inquiry",
      "Hi Ivan,\n\nI came across your portfolio and would like to get in touch about "
    );
    window.open(url, "_blank", "noopener");
  }

  /* ---------- fetch content ---------- */
  fetch("content.json")
    .then((r) => {
      if (!r.ok) throw new Error("content.json HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      state.content = data;
      render(data);
      requestAnimationFrame(() => {
        initReveal();
        initHeroSequence();
        initNav(data);
        initScrollSpy(data);
        initScrollChrome();
        initFabTop();
      });
    })
    .catch((err) => {
      console.error("Could not load content.json:", err);
      document.getElementById("main").innerHTML =
        '<p style="padding:120px 24px;font-family:sans-serif;color:#3d2b23;max-width:560px;margin:0 auto;">' +
        "This page loads its content from <code>content.json</code> via fetch, which requires " +
        "the files to be served over http(s) rather than opened directly as a local file. " +
        "Run a quick local server (e.g. <code>python3 -m http.server</code>) in this folder, " +
        "or deploy the folder to any static host, then open it from there." +
        "</p>";
    });

  /* ============================================================
     RENDER
     ============================================================ */
  function render(c) {
    document.title = c.meta.title;

    // Nav links (Skills / Projects)
    const navLinks = document.getElementById("navLinks");
    const contactBtn = document.getElementById("navContact");
    c.nav.forEach((item) => {
      const btn = el("button", {
        class: "nav-link",
        text: item.label,
        attrs: { type: "button", "data-scroll": item.target },
      });
      navLinks.insertBefore(btn, contactBtn);
    });
    contactBtn.textContent = "Contact Me";

    renderHero(c.hero, c.meta);
    renderIntroduction(c.introduction);
    renderEducation(c.education);
    renderSkills(c.skills);
    renderExperience(c.experience);
    renderProjects(c.projects);
    renderAchievement(c.achievement);
    renderCourses(c.courses);
    renderClosing(c.closing, c.meta);

    document.getElementById("footerNote").textContent =
      "\u00A9 2026 " + c.meta.name + ". Portfolio built from an original UI design.";
  }

  function renderHero(hero, meta) {
    document.querySelector(".hero-kicker").textContent = hero.kicker;

    const titleEl = document.getElementById("heroTitle");
    titleEl.textContent = "";
    hero.title.split("").forEach((ch, i) => {
      const span = el("span", { class: "char", text: ch === " " ? "\u00A0" : ch });
      span.style.transitionDelay = (i * 0.032).toFixed(3) + "s";
      titleEl.appendChild(span);
    });

    document.getElementById("heroName").textContent = meta.name;

    const ig = document.getElementById("heroInstagram");
    ig.textContent = meta.instagram.label;
    ig.href = meta.instagram.url;

    const ph = document.getElementById("heroPhone");
    ph.textContent = meta.phone.label;
    ph.href = meta.phone.url;

    const em = document.getElementById("heroEmail");
    em.textContent = meta.email;
    em.href = "mailto:" + meta.email;
    em.addEventListener("click", (e) => {
      e.preventDefault();
      openContactCompose(meta.email);
    });
  }

  function renderIntroduction(intro) {
    document.getElementById("introEyebrow").textContent = intro.eyebrow;
    document.getElementById("introTitle").textContent = intro.title;
    const wrap = document.getElementById("introParagraphs");
    intro.paragraphs.forEach((p) => wrap.appendChild(el("p", { text: p })));
    const img = document.getElementById("introImage");
    img.src = intro.image;
    img.alt = intro.imageAlt;
  }

  function renderEducation(edu) {
    document.getElementById("eduEyebrow").textContent = edu.eyebrow;
    document.getElementById("eduTitle").textContent = edu.title;
    document.getElementById("eduParagraph").textContent = edu.paragraph;
    const img = document.getElementById("eduImage");
    img.src = edu.image;
    img.alt = edu.imageAlt;
    const cap = document.getElementById("eduCaption");
    const strong = el("strong", { text: edu.card.school + "  \u00b7  " + edu.card.years });
    cap.appendChild(strong);
    cap.appendChild(el("span", { text: edu.card.detail }));
  }

  function renderSkills(skills) {
    document.getElementById("skillsEyebrow").textContent = skills.eyebrow;
    document.getElementById("skillsTitle").textContent = skills.title;
    document.getElementById("skillsIntro").textContent = skills.intro;
    const img = document.getElementById("skillsImage");
    img.src = skills.image;
    img.alt = skills.imageAlt;

    const grid = document.getElementById("skillsGrid");
    skills.categories.forEach((cat, i) => {
      const card = el("div", { class: "skill-card", attrs: { "data-reveal": "up", "data-delay": String(Math.min(i, 3)) } });
      card.appendChild(el("h3", { text: cat.title }));
      card.appendChild(el("p", { text: cat.text }));
      grid.appendChild(card);
    });
  }

  function renderExperience(exp) {
    document.getElementById("expEyebrow").textContent = exp.eyebrow;
    document.getElementById("expTitle").textContent = exp.title;
    document.getElementById("expIntro").textContent = exp.intro;

    const imgWrap = document.getElementById("expImages");
    exp.images.forEach((src, i) => {
      const img = el("img", { attrs: { src: src, alt: "Work experience photo " + (i + 1), "data-reveal": "scale", "data-delay": String(i) } });
      imgWrap.appendChild(img);
    });

    const grid = document.getElementById("expGrid");
    exp.roles.forEach((role, i) => {
      const card = el("div", { class: "exp-card", attrs: { "data-reveal": "up", "data-delay": String(Math.min(i, 3)) } });
      card.appendChild(el("h3", { text: role.title }));
      card.appendChild(el("p", { text: role.text }));
      grid.appendChild(card);
    });
  }

  function renderProjects(projects) {
    document.getElementById("projEyebrow").textContent = projects.eyebrow;
    document.getElementById("projTitle").textContent = projects.title;
    document.getElementById("projIntro").textContent = projects.intro;

    const cardsWrap = document.getElementById("projCards");
    projects.list.forEach((p, i) => {
      const card = el("button", {
        class: "proj-card",
        attrs: { type: "button", "data-scroll": p.id, "data-reveal": "up", "data-delay": String(i) },
      });
      const media = el("div", { class: "proj-card-media" });
      media.appendChild(el("img", { attrs: { src: p.image, alt: p.imageAlt } }));
      card.appendChild(media);

      const body = el("div", { class: "proj-card-body" });
      body.appendChild(el("span", { class: "proj-card-tag", text: p.tag }));
      body.appendChild(el("h3", { text: p.title }));
      body.appendChild(el("p", { text: p.summary }));
      const arrow = el("span", { class: "proj-card-arrow" });
      arrow.appendChild(document.createTextNode("View project "));
      arrow.appendChild(el("span", { class: "arrow-glyph", text: "\u2192" }));
      body.appendChild(arrow);
      card.appendChild(body);

      cardsWrap.appendChild(card);
    });

    const detailsRoot = document.getElementById("projectDetails");
    projects.list.forEach((p) => {
      const section = el("section", { class: "section project-detail", attrs: { id: p.id } });
      const inner = el("div", { class: "project-detail-inner" });

      const mediaWrapClass = p.images.length > 1 ? "pd-media duo" : "pd-media single";
      const mediaWrap = el("div", { class: mediaWrapClass, attrs: { "data-reveal": "right" } });
      p.images.forEach((src) => {
        mediaWrap.appendChild(el("img", { attrs: { src: src, alt: p.imageAlt } }));
      });
      inner.appendChild(mediaWrap);

      const copy = el("div", { class: "pd-copy", attrs: { "data-reveal": "left" } });
      copy.appendChild(el("span", { class: "pd-tag", text: p.tag }));
      copy.appendChild(el("h2", { text: p.title }));
      p.paragraphs.forEach((par) => copy.appendChild(el("p", { text: par })));

      const stats = el("div", { class: "pd-stats" });
      p.stats.forEach((s) => {
        const chip = el("div", { class: "pd-stat" });
        chip.appendChild(el("span", { class: "val", text: s.value }));
        chip.appendChild(el("span", { class: "lab", text: s.label }));
        stats.appendChild(chip);
      });
      copy.appendChild(stats);
      copy.appendChild(el("p", { class: "pd-note", text: p.detailNote }));
      inner.appendChild(copy);

      section.appendChild(inner);
      detailsRoot.appendChild(section);
    });
  }

  function renderAchievement(ach) {
    document.getElementById("achEyebrow").textContent = ach.eyebrow;
    document.getElementById("achTitle").textContent = ach.title;
    document.getElementById("achSubtitle").textContent = ach.subtitle;
    document.getElementById("achText").textContent = ach.text;
    const img = document.getElementById("achImage");
    img.src = ach.image;
    img.alt = ach.imageAlt;
  }

  function renderCourses(courses) {
    document.getElementById("coursesEyebrow").textContent = courses.eyebrow;
    document.getElementById("coursesTitle").textContent = courses.title;
    const list = document.getElementById("coursesList");
    courses.list.forEach((course, i) => {
      const card = el("div", { class: "course-card", attrs: { "data-reveal": "up", "data-delay": String(Math.min(i, 3)) } });
      card.appendChild(el("img", { attrs: { src: course.image, alt: course.imageAlt } }));
      const body = el("div", { class: "course-card-body" });
      body.appendChild(el("h3", { text: course.title }));
      body.appendChild(el("p", { text: course.text }));
      card.appendChild(body);
      list.appendChild(card);
    });
  }

  function renderClosing(closing, meta) {
    document.getElementById("closingTitle").textContent = closing.title;
    document.getElementById("closingText").textContent = closing.text;
    const cta = document.getElementById("closingCta");
    cta.textContent = closing.cta;
    cta.addEventListener("click", () => openContactCompose(meta.email));
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  function initReveal() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
  }

  function initHeroSequence() {
    // Small delay so the page paints first, then the hero performs
    // its one orchestrated load-in: kicker -> title -> meta -> image.
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById("heroTitle").classList.add("is-revealed");
      }, 260);
    });
  }

  /* ============================================================
     NAV / SMOOTH SCROLL
     ============================================================ */
  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.pageYOffset - NAV_H;
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
  }

  function initNav(content) {
    const navHome = document.getElementById("navHome");
    const navContact = document.getElementById("navContact");
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");

    navHome.addEventListener("click", () => {
      scrollToId("home");
      closeMobileNav();
    });

    navContact.addEventListener("click", () => {
      openContactCompose(content.meta.email);
      closeMobileNav();
    });

    // Delegate clicks for dynamically-created [data-scroll] targets
    // (nav links, project cards, footer "back to top", fab button).
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scroll]");
      if (!btn) return;
      const id = btn.getAttribute("data-scroll");
      if (id === "home") return; // handled by navHome above
      scrollToId(id);
      closeMobileNav();
    });

    document.getElementById("footerTop").addEventListener("click", () => scrollToId("home"));
    document.getElementById("fabTop").addEventListener("click", () => scrollToId("home"));

    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMobileNav();
    });

    function closeMobileNav() {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  }

  /* ============================================================
     SCROLL-SPY (active nav highlight)
     ============================================================ */
  function initScrollSpy(content) {
    const navHome = document.getElementById("navHome");
    const navButtons = {}; // target id -> button element
    content.nav.forEach((item) => {
      const btn = Array.from(document.querySelectorAll(".nav-link")).find(
        (b) => b.getAttribute("data-scroll") === item.target
      );
      if (btn) navButtons[item.target] = btn;
    });

    // Ordered list of every section id in document order, flagging
    // which ones actually have a nav entry to highlight.
    const order = [
      "home",
      "introduction",
      "education",
      "skills",
      "experience",
      "projects",
      "project-glove",
      "project-malaria",
      "achievement",
      "courses",
      "thankyou",
    ];
    const navKeyFor = { home: "__home__", skills: "skills", projects: "projects" };

    function setActive(key) {
      navHome.classList.toggle("is-active", key === "__home__");
      Object.keys(navButtons).forEach((target) => {
        navButtons[target].classList.toggle("is-active", key === target);
      });
    }

    let lastKey = null;
    function onScroll() {
      const pos = window.pageYOffset + NAV_H + 4;
      let currentId = "home";
      for (let i = 0; i < order.length; i++) {
        const sec = document.getElementById(order[i]);
        if (sec && sec.offsetTop <= pos) currentId = order[i];
      }
      // walk backward to nearest id that has a nav key
      let idx = order.indexOf(currentId);
      let key = null;
      while (idx >= 0 && key === null) {
        const candidate = order[idx];
        if (navKeyFor[candidate]) key = navKeyFor[candidate];
        idx--;
      }
      if (!key) key = "__home__";
      if (key !== lastKey) {
        setActive(key);
        lastKey = key;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     SCROLL CHROME: progress bar + nav blur/shadow state
     ============================================================ */
  function initScrollChrome() {
    const bar = document.getElementById("progressBar");
    const nav = document.getElementById("siteNav");
    function onScroll() {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
      nav.classList.toggle("is-scrolled", scrollTop > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  /* ============================================================
     BACK-TO-TOP FAB
     ============================================================ */
  function initFabTop() {
    const fab = document.getElementById("fabTop");
    function onScroll() {
      fab.classList.toggle("is-visible", window.pageYOffset > window.innerHeight * 0.7);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
