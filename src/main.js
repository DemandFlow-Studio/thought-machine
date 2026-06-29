import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/all';
import Lenis from 'lenis';
import createGlobe from './lib/cobe-custom.js';
import Swiper from 'swiper';
import { Navigation, Scrollbar } from 'swiper/modules';
import 'swiper/css';


gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);
CustomEase.create('button-046-ease', '0.32, 0.72, 0, 1');

// Top-level so it's accessible throughout the file
let lenis = null;

let rafCallback = null;
let touchQuery = null;

function initLenis() {
  
  // Set up the listener once, then evaluate current state
  if (!touchQuery) {
    touchQuery = window.matchMedia('(pointer: coarse)');
    touchQuery.addEventListener('change', syncLenis);
  }
  syncLenis();
}

function syncLenis() {
  if (touchQuery.matches) {
    destroyLenis();
  } else {
    startLenis();
  }
}

function startLenis() {
  if (lenis) return; // already running

  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);

  rafCallback = (time) => {
    lenis.raf(time * 1000); // seconds → milliseconds
  };
  gsap.ticker.add(rafCallback);
  gsap.ticker.lagSmoothing(0);
}

function destroyLenis() {
  if (!lenis) return; // already stopped

  gsap.ticker.remove(rafCallback);
  rafCallback = null;

  lenis.destroy();
  lenis = null;

  gsap.ticker.lagSmoothing(500, 33); // restore GSAP default
  ScrollTrigger.refresh();
}


function initButton046() {
  const buttons = document.querySelectorAll('[data-button-046]');
  if (buttons.length === 0) return;
  
  let mm = gsap.matchMedia();

  buttons.forEach((button) => {
    const circle = button.querySelector('[data-button-046-circle]');
    if (!circle) return;

    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const xSet = gsap.quickSetter(circle, 'xPercent');
      const ySet = gsap.quickSetter(circle, 'yPercent');

      function getXY(e) {
        const { left, top, width, height } = button.getBoundingClientRect();
        const xTransform = gsap.utils.pipe(gsap.utils.mapRange(0, width, 0, 100), gsap.utils.clamp(0, 100));
        const yTransform = gsap.utils.pipe(gsap.utils.mapRange(0, height, 0, 100), gsap.utils.clamp(0, 100));

        return {
          x: xTransform(e.clientX - left),
          y: yTransform(e.clientY - top),
        };
      }

      function onEnter(e) {
        const { x, y } = getXY(e);
        xSet(x);
        ySet(y);
        gsap.to(circle, {
          scale: 1,
          duration: 1.25,
          ease: 'button-046-ease',
          overwrite: 'auto',
        });
      }

      function onLeave(e) {
        const { x, y } = getXY(e);

        gsap.killTweensOf(circle);

        gsap.to(circle, {
          xPercent: x > 90 ? x + 25 : x < 12.5 ? x - 25 : x,
          yPercent: y > 90 ? y + 25 : y < 12.5 ? y - 25 : y,
          scale: 0,
          duration: 0.45,
          ease: 'button-046-ease',
          overwrite: 'auto',
        });
      }

      function onMove(e) {
        const { x, y } = getXY(e);

        gsap.to(circle, {
          xPercent: x,
          yPercent: y,
          duration: 0.5,
          ease: 'power1',
          overwrite: 'auto',
        });
      }

      button.addEventListener('pointerenter', onEnter);
      button.addEventListener('pointerleave', onLeave);
      button.addEventListener('pointermove', onMove);

      return () => {
        button.removeEventListener('pointerenter', onEnter);
        button.removeEventListener('pointerleave', onLeave);
        button.removeEventListener('pointermove', onMove);
      };
    });
  });
}

  function initMediaSetup() {
  const mediaElements = document.querySelectorAll("[data-media-init]");
  if (!mediaElements.length) return;

  const pauseDelay = 200;
  const viewportOffset = 0.1;
  const isHoverDevice = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  initMediaSetup._cleanup?.forEach(fn => fn());
  const cleanupFns = [];
  const rootMarginValue = viewportOffset * 100;

  mediaElements.forEach(mediaEl => {
    const video = mediaEl.querySelector("[data-media-video-src]");
    if (!video) return;

    const mode = mediaEl.dataset.mediaMode || "autoplay";
    const touchMode = mediaEl.dataset.mediaTouchMode;
    const resetAttr = mediaEl.dataset.mediaReset;
    const pausedStatusAttr = mediaEl.dataset.mediaOnPause;
    const toggleElements = [...mediaEl.querySelectorAll("[data-media-toggle]")];

    const activeMode = !isHoverDevice ? (touchMode || (mode === "hover" ? "autoplay" : mode)) : mode;
    const shouldResetOnPause = resetAttr === "true" ? true : resetAttr === "false" ? false : activeMode === "hover";
    const pausedStatus = pausedStatusAttr === "paused" ? "paused" : "not-active";

    const clickTargets = toggleElements.length ? toggleElements : [mediaEl];
    const shouldUseClickToggle = activeMode === "click" || (activeMode === "autoplay" && toggleElements.length);

    let isInView = false;
    let isHovering = false;
    let hasLoaded = false;
    let userPaused = false;
    let userActivated = false;
    let isActivated = false;
    let shouldBePlaying = false;
    let pauseTimer = null;

    const setStatus = status => {
      mediaEl.dataset.mediaStatus = status;
    };

    const clearPauseTimer = () => {
      clearTimeout(pauseTimer);
    };

    const addCleanup = fn => {
      cleanupFns.push(fn);
    };

    const on = (target, event, handler) => {
      target.addEventListener(event, handler);
      addCleanup(() => target.removeEventListener(event, handler));
    };

    const playAttempt = () => {
      video.play().then(() => {
        if (shouldBePlaying) setStatus("playing");
      }).catch(() => {});
    };

    const loadVideo = () => {
      if (hasLoaded) return;

      const src = video.dataset.mediaVideoSrc;
      if (!src) return;

      video.muted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.src = src;
      video.load();
      hasLoaded = true;
    };

    const shouldResume = () => {
      if (!isInView || document.hidden) return false;
      if (activeMode === "autoplay") return !userPaused;
      if (activeMode === "click") return userActivated && !userPaused;
      return isHovering;
    };

    const playVideo = () => {
      if (!isInView || document.hidden) return;

      shouldBePlaying = true;
      clearPauseTimer();
      loadVideo();
      setStatus(video.readyState < 3 ? "loading" : "playing");
      playAttempt();
    };

    const pauseVideo = (delay = 0, reset = false) => {
      shouldBePlaying = false;
      clearPauseTimer();

      pauseTimer = setTimeout(() => {
        video.pause();
        if (reset) video.currentTime = 0;
      }, delay);
    };

    const handleHoverIn = () => {
      if (!isInView || document.hidden) return;

      isHovering = true;
      clearPauseTimer();

      if (!video.paused) {
        shouldBePlaying = true;
        setStatus("playing");
        return;
      }

      playVideo();
    };

    const handleHoverOut = () => {
      if (!isInView) return;

      isHovering = false;
      setStatus(pausedStatus);
      pauseVideo(pauseDelay, shouldResetOnPause);
    };

    const handleClick = () => {
      if (!isInView || document.hidden) return;

      clearPauseTimer();

      if (video.paused) {
        userActivated = true;
        userPaused = false;
        playVideo();
      } else {
        userActivated = true;
        userPaused = true;
        setStatus(pausedStatus);
        pauseVideo(pauseDelay, shouldResetOnPause);
      }
    };

    const handleViewport = entries => {
      entries.forEach(entry => {
        if (entry.target !== mediaEl) return;

        if (!isActivated && entry.isIntersecting) {
          isActivated = true;

          if (shouldUseClickToggle) {
            clickTargets.forEach(toggleEl => on(toggleEl, "click", handleClick));
          }

          if (activeMode === "hover") {
            on(mediaEl, "mouseenter", handleHoverIn);
            on(mediaEl, "mouseleave", handleHoverOut);
          }
        }

        isInView = entry.isIntersecting;

        if (isInView) {
          if (shouldResume()) playVideo();
        } else {
          isHovering = false;

          if (!video.paused || shouldBePlaying) {
            setStatus("paused");
            pauseVideo(0, false);
          }
        }
      });
    };

    const handlePageVisibilityChange = () => {
      if (document.hidden) {
        if (!video.paused || shouldBePlaying) {
          setStatus("paused");
          pauseVideo(0, false);
        }
        return;
      }
      if (shouldResume()) playVideo();
    };

    mediaEl.dataset.mediaStatus = "not-active";

    const observer = new IntersectionObserver(handleViewport, {
      rootMargin: `${rootMarginValue}% 0px ${rootMarginValue}% 0px`,
      threshold: 0
    });

    observer.observe(mediaEl);

    on(video, "playing", () => {if (shouldBePlaying) setStatus("playing");});
    on(video, "waiting", () => {if (shouldBePlaying) setStatus("loading");});
    on(video, "canplay", () => {if (shouldBePlaying && isInView && !document.hidden) playAttempt();});
    on(video, "loadeddata", () => {if (shouldBePlaying && isInView && !document.hidden) playAttempt();});
    on(video, "ended", () => {if (!shouldBePlaying || !isInView || document.hidden) return; video.currentTime = 0; playAttempt();});

    on(document, "visibilitychange", handlePageVisibilityChange);

    addCleanup(() => observer.disconnect());
    addCleanup(() => {
      clearPauseTimer();
      shouldBePlaying = false;
      video.pause();
    });
  });

  initMediaSetup._cleanup = cleanupFns;
}

  function initMarqueeScrollDirection() {
  document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    // Query marquee elements
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    // Get data attributes
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // GSAP animation for marquee content
    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100, // Move completely out of view
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize marquee in the correct direction
    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial marquee status
    marquee.setAttribute('data-marquee-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;

        // Update animation direction and marquee status
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 1
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: 'none' });
  });
}

function initMegaNavDirectionalHover() {
  const DUR = {
    bgMorph: 0.4,
    contentIn: 0.3,
    contentOut: 0.2,
    stagger: 0.25,
    backdropIn: 0.3,
    backdropOut: 0.2,
    openScale: 0.35,
    closeScale: 0.25,
  };
  
  const HOVER_ENTER = 120;
  const HOVER_LEAVE = 150;

  // DOM references
  const menuWrap = document.querySelector("[data-menu-wrap]");
  const navList = document.querySelector("[data-nav-list]");
  const dropWrapper = document.querySelector("[data-dropdown-wrapper]");
  const dropContainer = document.querySelector("[data-dropdown-container]");
  const dropBg = document.querySelector("[data-dropdown-bg]");
  const backdrop = document.querySelector("[data-menu-backdrop]");
  const toggles = [...document.querySelectorAll("[data-dropdown-toggle]")];
  const panels = [...document.querySelectorAll("[data-nav-content]")];
  const burger = document.querySelector("[data-burger-toggle]");
  const backBtn = document.querySelector("[data-mobile-back]");
  const logo = document.querySelector("[data-menu-logo]");
  const [lineTop, lineMid, lineBot] = ["top", "mid", "bot"].map(
    (id) => document.querySelector(`[data-burger-line='${id}']`)
  );

  // State
  const state = {
    isOpen: false,
    activePanel: null,
    activePanelIndex: -1,
    isMobile: window.innerWidth <= 991,
    mobileMenuOpen: false,
    mobilePanelActive: null,
    hoverTimer: null,
    leaveTimer: null,
    tl: null,
    mobileTl: null,
    mobilePanelTl: null,
  };

  // Helpers
  const getPanel = (name) => document.querySelector(`[data-nav-content="${name}"]`);
  const getToggle = (name) => document.querySelector(`[data-dropdown-toggle="${name}"]`);
  const getFade = (el) => el.querySelectorAll("[data-menu-fade]");
  const getNavItems = () => navList.querySelectorAll("[data-nav-list-item]");
  const getIndex = (name) => toggles.indexOf(getToggle(name));
  const stagger = (n) => (n <= 1 ? 0 : { amount: DUR.stagger });
  const isPanelHidden = (name) => !!getToggle(name)?.hasAttribute("data-panel-hidden");

  function clearTimers() {
    clearTimeout(state.hoverTimer);
    clearTimeout(state.leaveTimer);
    state.hoverTimer = state.leaveTimer = null;
  }

  function killTl(key) {
    if (state[key]) { state[key].kill(); state[key] = null; }
  }

  function killDropdown() {
    killTl("tl");
    gsap.killTweensOf(dropContainer);
    gsap.killTweensOf(backdrop);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function killMobile() {
    killTl("mobileTl");
    gsap.killTweensOf([navList, lineTop, lineMid, lineBot]);
  }

  function killMobilePanel() {
    killTl("mobilePanelTl");
    gsap.killTweensOf(getNavItems());
    gsap.killTweensOf([backBtn, logo]);
    panels.forEach((p) => { gsap.killTweensOf(p); gsap.killTweensOf(getFade(p)); });
  }

  function resetToggles() {
    toggles.forEach((t) => t.setAttribute("aria-expanded", "false"));
  }

  function resetDesktop() {
    panels.forEach((p) => {
      gsap.set(p, { visibility:"hidden", opacity:0, pointerEvents:"none", x:0, y:0, xPercent:0 });
      gsap.set(getFade(p), { autoAlpha:0, x:0, y:0, xPercent:0 });
    });
  
    gsap.set(dropContainer, { height:0, clearProps:"transform" });
    gsap.set(backdrop, { autoAlpha:0 });
  
    menuWrap.setAttribute("data-menu-open", "false");
    resetToggles();
  }

  function setupMobile() {
    panels.forEach((p) => {
      gsap.set(p, { autoAlpha: 0, xPercent: 0, visibility: "visible", pointerEvents: "none" });
      gsap.set(getFade(p), { xPercent: 20, autoAlpha: 0 });
    });
    gsap.set(getNavItems(), { xPercent: 0, y: 0, autoAlpha: 1 });
    gsap.set(navList, { autoAlpha: 0, x: 0 });
    gsap.set(backBtn, { autoAlpha: 0 });
    gsap.set(logo, { autoAlpha: 1 });
    gsap.set(dropContainer, { clearProps: "height" });
    gsap.set(backdrop, { autoAlpha: 0 });
  }

  function measurePanel(name) {
    const el = getPanel(name);
    if (!el) return 0;
    const s = el.style;
    const prev = [s.visibility, s.opacity, s.pointerEvents];
    Object.assign(s, { visibility: "visible", opacity: "0", pointerEvents: "none" });
    const h = el.getBoundingClientRect().height;
    [s.visibility, s.opacity, s.pointerEvents] = prev;
    return h;
  }

  // DESKTOP — open dropdown (first open)
  function openDropdown(panelName) {
    if (state.isOpen && state.activePanel === panelName) return;
    if (state.isOpen) return switchPanel(state.activePanel, panelName);

    const hidden = isPanelHidden(panelName);
    const height = hidden ? 0 : measurePanel(panelName);
    if (!hidden && !height) return;

    killDropdown();
    resetDesktop();

    const el = getPanel(panelName);
    const fade = getFade(el);
    const toggle = getToggle(panelName);

    state.isOpen = true;
    state.activePanel = panelName;
    state.activePanelIndex = getIndex(panelName);
    menuWrap.setAttribute("data-menu-open", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "true");

    gsap.set(dropContainer, { height: 0 });

    const tl = gsap.timeline();
    state.tl = tl;
    tl.to(backdrop, { autoAlpha: 1, duration: DUR.backdropIn, ease: "power2.out" }, 0);
    tl.to(dropContainer, { height, duration: DUR.openScale, ease: "power3.out" }, 0);
    tl.set(el, { visibility: "visible", opacity: 1, pointerEvents: "auto" }, 0.05);
    if (fade.length) {
      tl.fromTo(fade,
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: DUR.contentIn, stagger: stagger(fade.length), ease: "power3.out" },
        0.1
      );
    }
  }

  // DESKTOP — close dropdown
  function closeDropdown() {
    if (!state.isOpen) return;
    const el = getPanel(state.activePanel);
    const fade = el ? getFade(el) : [];

    killDropdown();

    const tl = gsap.timeline({
      onComplete() {
        state.isOpen = false;
        state.activePanel = null;
        state.activePanelIndex = -1;
        state.tl = null;
        resetDesktop();
      },
    });
    state.tl = tl;
    if (fade.length) tl.to(fade, { autoAlpha: 0, y: -4, duration: DUR.contentOut * 0.7, ease: "power2.in" }, 0);
    tl.to(dropContainer, { height: 0, duration: DUR.closeScale, ease: "power2.in" }, 0.05);
    tl.to(backdrop, { autoAlpha: 0, duration: DUR.backdropOut, ease: "power2.out" }, 0);
    if (el) tl.set(el, { visibility: "hidden", opacity: 0, pointerEvents: "none" });
  }

  // DESKTOP — switch panel (directional)
  function switchPanel(fromName, toName) {
    const dir = getIndex(toName) > getIndex(fromName) ? 1 : -1;
    const fromEl = getPanel(fromName), toEl = getPanel(toName);
    if (!fromEl || !toEl) return;

    const fromFade = getFade(fromEl), toFade = getFade(toEl);
    const toHidden = isPanelHidden(toName);
    const toHeight = toHidden ? 0 : measurePanel(toName);
    if (!toHidden && !toHeight) return;

    killDropdown();

    // Reset all panels, then restore fromEl as visible
    panels.forEach((p) => {
      gsap.set(p, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 });
      gsap.set(getFade(p), { autoAlpha: 0, x: 0, y: 0 });
    });
    gsap.set(fromEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", x: 0 });
    if (fromFade.length) gsap.set(fromFade, { autoAlpha: 1, x: 0, y: 0 });
    gsap.set(backdrop, { autoAlpha: 1 });

    const toToggle = getToggle(toName);
    state.activePanel = toName;
    state.activePanelIndex = getIndex(toName);
    resetToggles();
    if (toToggle) toToggle.setAttribute("aria-expanded", "true");

    const xOut = dir * -30, xIn = dir * 30;
    const tl = gsap.timeline();
    state.tl = tl;

    if (fromFade.length) tl.to(fromFade, { autoAlpha: 0, x: xOut, duration: DUR.contentOut, ease: "power2.in" }, 0);
    tl.set(fromEl, { visibility: "hidden", opacity: 0, pointerEvents: "none", xPercent: 0 }, DUR.contentOut);
    if (fromFade.length) tl.set(fromFade, { x: 0 }, DUR.contentOut);
    tl.to(dropContainer, { height: toHeight, duration: DUR.bgMorph, ease: "power3.out" }, 0.05);
    tl.set(toEl, { visibility: "visible", opacity: 1, pointerEvents: "auto", xPercent: 0 }, DUR.contentOut * 0.5);
    if (toFade.length) {
      tl.fromTo(toFade,
        { autoAlpha: 0, x: xIn },
        { autoAlpha: 1, x: 0, duration: DUR.contentIn, stagger: stagger(toFade.length), ease: "power3.out" },
        DUR.contentOut * 0.6
      );
    }
  }

  // DESKTOP — hover intent
  function handleToggleEnter(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (!name) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
    clearTimeout(state.hoverTimer);
    state.hoverTimer = setTimeout(() => openDropdown(name), state.isOpen ? 0 : HOVER_ENTER);
  }

  function handleToggleLeave() {
    if (state.isMobile) return;
    clearTimeout(state.hoverTimer); state.hoverTimer = null;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  function handleWrapperEnter() {
    if (state.isMobile) return;
    clearTimeout(state.leaveTimer); state.leaveTimer = null;
  }

  function handleWrapperLeave() {
    if (state.isMobile) return;
    state.leaveTimer = setTimeout(closeDropdown, HOVER_LEAVE);
  }

  // DESKTOP — close behaviors
  function handleEscape(e) {
    if (e.key !== "Escape") return;
    if (state.isMobile) {
      state.mobilePanelActive ? closeMobilePanel() : state.mobileMenuOpen && closeMobileMenu();
      return;
    }
    if (state.isOpen) {
      const t = getToggle(state.activePanel);
      closeDropdown();
      if (t) t.focus();
    }
  }

  function handleDocClick(e) {
    if (state.isMobile || !state.isOpen) return;
    if (!e.target.closest("[data-menu-wrap]")) closeDropdown();
  }

  // DESKTOP — keyboard navigation
  function focusFirstLink(panelName) {
    setTimeout(() => {
      const el = getPanel(panelName);
      if (!el) return;
      const link = el.querySelector("a");
      if (!link) return;
      gsap.set(link, { visibility: "visible" });
      link.focus();
    }, 80);
  }

  function handleKeydownOnToggle(e) {
    if (state.isMobile) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (state.isOpen && state.activePanel === name) closeDropdown();
      else { openDropdown(name); focusFirstLink(name); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!state.isOpen || state.activePanel !== name) openDropdown(name);
      focusFirstLink(name);
    }
    if (e.key === "Tab" && !e.shiftKey && state.isOpen && state.activePanel === name) {
      e.preventDefault();
      const link = getPanel(name)?.querySelector("a");
      if (link) link.focus();
    }
  }

  function handleKeydownInPanel(e) {
    if (state.isMobile || !state.isOpen) return;
    const el = getPanel(state.activePanel);
    if (!el) return;

    const links = [...el.querySelectorAll("a")];
    const idx = links.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(idx + 1) % links.length].focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx <= 0) { const t = getToggle(state.activePanel); if (t) t.focus(); }
      else links[idx - 1].focus();
    }
    if (e.key === "Tab" && !e.shiftKey && idx === links.length - 1) {
      e.preventDefault();
      const curIdx = toggles.indexOf(getToggle(state.activePanel));
      const next = curIdx < toggles.length - 1 ? toggles[curIdx + 1] : null;
      closeDropdown();
      if (next) next.focus();
    }
    if (e.key === "Tab" && e.shiftKey && idx === 0) {
      e.preventDefault();
      const t = getToggle(state.activePanel);
      if (t) t.focus();
    }
  }

  // MOBILE — burger animation
  function animateBurger(toX) {
    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    if (toX) {
      tl.to(lineTop, { y: "0.375em", duration: 0.15 }, 0);
      tl.to(lineBot, { y: "-0.375em", duration: 0.15 }, 0);
      tl.to(lineMid, { autoAlpha: 0, duration: 0.1 }, 0.1);
      tl.to(lineTop, { rotation: 45, duration: 0.2 }, 0.15);
      tl.to(lineBot, { rotation: -45, duration: 0.2 }, 0.15);
    } else {
      tl.to(lineTop, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineBot, { rotation: 0, duration: 0.2 }, 0);
      tl.to(lineTop, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineBot, { y: 0, duration: 0.15 }, 0.15);
      tl.to(lineMid, { autoAlpha: 1, duration: 0.1 }, 0.15);
    }
    return tl;
  }

  // MOBILE — open/close menu
  function openMobileMenu() {
    killMobile();
    state.mobileMenuOpen = true;
    menuWrap.setAttribute("data-menu-open", "true");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";

    const items = getNavItems();
    const tl = gsap.timeline();
    state.mobileTl = tl;
    tl.add(animateBurger(true), 0);
    tl.to(navList, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0);
    if (items.length) {
      tl.fromTo(items,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: "power3.out" },
        0.15
      );
    }
  }

  function closeMobileMenu() {
    const hadPanel = state.mobilePanelActive;
    const panelEl = hadPanel ? getPanel(hadPanel) : null;
  
    killMobile();
    killMobilePanel();
  
    menuWrap.setAttribute("data-menu-open", "false");
    state.mobileMenuOpen = false;
    state.mobilePanelActive = null;
    burger.setAttribute("aria-expanded", "false");
  
    const tl = gsap.timeline({
      onComplete() {
        document.body.style.overflow = "";
        state.mobileTl = null;
        setupMobile();
      },
    });
    state.mobileTl = tl;
  
    tl.add(animateBurger(false), 0);
  
    // If a panel was open, fade it out with the close — no snap reset
    if (hadPanel && panelEl) {
      tl.to(panelEl, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
      tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0.05);
    }
  
    // Fade out the nav list container
    tl.to(navList, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.05);
  }

  // MOBILE — slide-over panels 
  function openMobilePanel(panelName) {
    const el = getPanel(panelName);
    if (!el) return;
    killMobilePanel();
    state.mobilePanelActive = panelName;

    const navItems = getNavItems();
    const panelFade = getFade(el);

    const tl = gsap.timeline();
    state.mobilePanelTl = tl;

    // Fade out each nav item to the left
    if (navItems.length) {
      tl.to(navItems, {
        xPercent: -10, autoAlpha: 0,
        duration: 0.35, stagger: 0.03, ease: "power2.in",
      }, 0);
    }

    // Logo → back button swap
    tl.to(logo, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(backBtn, { autoAlpha: 1, duration: 0.25, ease: "power2.inOut" }, 0.15);

    // Show panel container, then fade in its items from the right
    tl.set(el, { autoAlpha: 1, xPercent: 0, pointerEvents: "auto" }, 0.2);
    if (panelFade.length) {
      tl.fromTo(panelFade,
        { xPercent: 8, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.3, stagger: stagger(panelFade.length), ease: "power3.out" },
        0.25
      );
    }
  }

  function closeMobilePanel() {
    if (!state.mobilePanelActive) return;
    const el = getPanel(state.mobilePanelActive);
    if (!el) return;
    killMobilePanel();

    const navItems = getNavItems();
    const panelFade = getFade(el);

    const tl = gsap.timeline({
      onComplete() { state.mobilePanelActive = null; state.mobilePanelTl = null; },
    });
    state.mobilePanelTl = tl;

    // Fade out panel items to the right
    if (panelFade.length) {
      tl.to(el, {
        xPercent: 20, autoAlpha: 0,
        duration: 0.3, stagger: 0.02, ease: "power2.in",
      }, 0);
    }

    // Hide panel
    tl.set(el, { autoAlpha: 0, pointerEvents: "none" }, 0.25);

    // Back → logo swap
    tl.to(backBtn, { autoAlpha: 0, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(logo, { autoAlpha: 1, duration: 0.25, ease: "power2.out" }, 0.15);

    // Fade nav items back in from center
    if (navItems.length) {
      tl.fromTo(navItems,
        { xPercent: -20, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: "power3.out" },
        0.25
      );
    }
  }

  function handleToggleClick(e) {
    if (!state.isMobile || !state.mobileMenuOpen) return;
    // On phones (<768px) the dropdowns are native Webflow dropdowns — don't hijack
    // the click with the custom slide-in panel. Tablet (768–991) keeps the panels.
    if (window.innerWidth < 768) return;
    const name = e.currentTarget.getAttribute("data-dropdown-toggle");
    if (name) { e.preventDefault(); openMobilePanel(name); }
  }

  // RESIZE
  let resizeTimer = null;
  let lastWidth = window.innerWidth;
  function handleResize() {
    const w = window.innerWidth;
    if (w === lastWidth) return;
    lastWidth = w;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const was = state.isMobile;
      state.isMobile = window.innerWidth <= 991;

      if (was && !state.isMobile) {
        killMobile(); killMobilePanel();
        gsap.set(navList, { clearProps: "all" });
        gsap.set(getNavItems(), { clearProps: "all" });
        gsap.set(backBtn, { autoAlpha: 0 });
        gsap.set(logo, { clearProps: "all" });
        gsap.set([lineTop, lineMid, lineBot], { rotation: 0, y: 0, autoAlpha: 1 });
      
        panels.forEach((p) => {
          gsap.set(p, { clearProps: "all" });
          gsap.set(getFade(p), { clearProps: "all" });
        });
      
        burger.setAttribute("aria-expanded", "false");
        state.mobileMenuOpen = false;
        state.mobilePanelActive = null;
        document.body.style.overflow = "";
        resetDesktop();
      }
      
      if (!was && state.isMobile) {
        killDropdown();
        state.isOpen = false; state.activePanel = null; state.activePanelIndex = -1;
        clearTimers();
        menuWrap.setAttribute("data-menu-open", "false");
        resetToggles();
        setupMobile();
      }
      
    }, 150);
  }

  // EVENT BINDING
  toggles.forEach((btn) => {
    btn.addEventListener("mouseenter", handleToggleEnter);
    btn.addEventListener("mouseleave", handleToggleLeave);
    btn.addEventListener("keydown", handleKeydownOnToggle);
    btn.addEventListener("click", handleToggleClick);
  });
  
  dropWrapper.addEventListener("mouseenter", handleWrapperEnter);
  dropWrapper.addEventListener("mouseleave", handleWrapperLeave);
  
  panels.forEach((p) => p.addEventListener("keydown", handleKeydownInPanel));
  
  backdrop.addEventListener("click", closeDropdown);
  
  document.addEventListener("keydown", handleEscape);
  document.addEventListener("click", handleDocClick);
  
  burger.addEventListener("click", () => state.mobileMenuOpen ? closeMobileMenu() : openMobileMenu());
  
  backBtn.addEventListener("click", closeMobilePanel);
  
  window.addEventListener("resize", handleResize);

  // INIT
  state.isMobile ? setupMobile() : resetDesktop();
}


function initCobe() {
  const canvas = document.querySelector('[data-cobe-canvas]');
  if (!canvas) return;

  // Skip on mobile (run on tablet and up). 768px is Webflow's tablet breakpoint —
  // mobile landscape tops out at 767px, so < 768 = phone.
  if (window.innerWidth < 768) return;

  // Cap DPR at 2 — anything higher just burns GPU with no visible gain
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cobe expects colors as 0–1 RGB triplets, not 0–255
  const BLUE = [0.16, 0.55, 1];
  const PURPLE = [0.62, 0.24, 1];

  // A dispersed, lightly-randomised set of points (regenerated on each load).
  // Latitudes are biased to the upper hemisphere since only the top of the globe is
  // in view, and longitudes are evenly spread + jittered so points don't cluster.
  // Swap this for a fixed array of { id, location:[lat,lng], color } to pin them.
  // POINT_COUNT must be even — points are paired off into arcs (see below).
  const palette = [BLUE, PURPLE];
  const rand = (min, max) => min + Math.random() * (max - min);
  const POINT_COUNT = 8;
  const markers = Array.from({ length: POINT_COUNT }, (_, i) => ({
    id: `pt-${i}`,
    location: [rand(22, 68), -180 + (360 / POINT_COUNT) * i + rand(-12, 12)],
    size: 0.025,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  // Pair the points into a random matching: every dot gets exactly one arc (so no
  // dot is left unconnected) and the arcs don't chain through shared endpoints.
  const shuffled = markers.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const arcs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    arcs.push({
      from: shuffled[i].location,
      to: shuffled[i + 1].location,
      color: palette[Math.floor(Math.random() * palette.length)],
    });
  }

  // --- Sizing -----------------------------------------------------------------
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;

  // Push the globe down so only the upper "dome" sits in view — pair this with
  // your bottom gradient mask in CSS for the faded-horizon look.
  const verticalOffset = () => height * dpr * 0.575;

  // Shared with the HTML overlay projection below, so the dots stay locked to the
  // rendered markers. Keep these in sync with the createGlobe options.
  const scale = 3;
  const markerElevation = 0;

  // --- Rotation, drag & inertia -----------------------------------------------
  // We render `phi`/`theta` but ease them toward `*Target` each frame, so dragging
  // feels weighty rather than instantaneous. On release, `phiVel` carries the last
  // drag speed and decays (momentum) before the idle auto-spin resumes.
  let phi = 0;             // rendered azimuth (passed to the globe)
  let phiTarget = 0;       // where drag / inertia wants phi to be
  let phiVel = 0;          // angular velocity used for post-release momentum
  const theta = 0.3;       // fixed tilt (dome framing) — dragging is horizontal-only
  let pointerDown = false;
  let lastX = 0;

  const autoSpeed = reduceMotion ? 0 : 0.00125; // idle auto-spin (radians/frame)
  const DRAG_SENS = 0.0025;   // radians of rotation per px dragged
  const SMOOTH = 0.06;        // 0..1 ease toward target each frame (higher = snappier)
  const FRICTION = 0.975;     // momentum decay per frame after release (lower = stops sooner)

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none'; // let us own the drag gesture on touch devices

  const onPointerDown = (e) => {
    pointerDown = true;
    lastX = e.clientX;
    phiVel = 0;            // cancel leftover momentum when grabbed
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!pointerDown) return;
    const dx = e.clientX - lastX;     // horizontal drag only — vertical is ignored
    lastX = e.clientX;
    phiTarget += dx * DRAG_SENS;
    phiVel = dx * DRAG_SENS;          // last movement seeds the release momentum
  };

  const onPointerUp = () => {
    pointerDown = false;
    canvas.style.cursor = 'grab';
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // --- Globe ------------------------------------------------------------------
  const globe = createGlobe(canvas, {
    devicePixelRatio: dpr,          // backing-store density; capped at 2 above
    width: width * dpr,             // buffer size in px (CSS size * dpr)
    height: height * dpr,
    phi: 0,                         // start azimuth; driven by the render loop after
    theta,                          // start tilt (vertical angle)
    dark: 1,                        // 1 = dark mode: the DOTS are the lit element, so landColor colours the dots
                                    //                 themselves. 0 = light mode: dots are dark holes in a lit field.
    diffuse: 1.2,                   // 0..~2 — directional shading; lower = flatter (less night-side falloff)
    mapSamples: 18000,              // number of dots sampled across the map (density)
    mapBrightness: 8,               // brightness of the COUNTRY dots — raise for lighter
    mapBaseBrightness: 0,           // brightness of the OCEAN dots — 0 = only continents show on the solid fill
    baseColor: [0.09803921568627451, 0.09803921568627451, 0.09803921568627451],   // colour of the ocean dots (only shows if mapBaseBrightness > 0)
    landColor: [0.1, 0.1, 0.1],  // PATCHED option: colour of the COUNTRY dots, independent of baseColor
    baseFill: [0.09803921568627451, 0.09803921568627451, 0.09803921568627451],     // PATCHED option: solid sphere colour behind the dots (your old base grey)
    markerColor: BLUE,              // fallback for markers without their own color
    glowColor: [0.09803921568627451, 0.09803921568627451, 0.09803921568627451], // atmosphere rim glow
    arcColor: BLUE,                 // fallback for arcs without their own color
    arcWidth: 0.1,                  // thickness of the arc lines
    arcHeight: 0.33,                // how high the arcs bow off the surface
    markerElevation,                // how far markers float above the surface
    opacity: 1,                     // 0..1 — overall globe opacity
    scale,                          // zoom — larger fills more of the section
    offset: [0, verticalOffset()],  // [x, y] px shift of the globe within the canvas
    markers: [],                    // cobe's own markers are flat solid dots; the HTML
                                    // overlay below renders the markers instead (so they
                                    // can glow / animate). Pass `markers` here to re-enable.
    arcs,
  });

  // --- HTML marker overlays (cross-browser) -----------------------------------
  // cobe's built-in "bindable markers" rely on CSS Anchor Positioning, which only
  // works in Chromium. To support every browser we project each marker to screen
  // space ourselves (mirroring cobe's marker vertex shader) and drive plain
  // absolutely-positioned elements. Each marker gets a <div class="cobe-marker">
  // you can style/animate freely; it fades out as the point rotates behind the globe.
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smoothstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const rgbToCss = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(', ')})`;

  // Inject low-specificity defaults once so dots are visible out of the box but any
  // CSS you write (in Webflow) overrides them easily.
  if (!document.getElementById('cobe-marker-styles')) {
    const style = document.createElement('style');
    style.id = 'cobe-marker-styles';
    style.textContent =
      '.cobe-marker :where(.cobe-marker__dot){display:block;width:10px;height:10px;' +
      'border-radius:9999px;background:var(--cobe-color,#4ea3ff);' +
      'box-shadow:0 0 10px 1px var(--cobe-color,#4ea3ff);}';
    document.head.appendChild(style);
  }

  // cobe wraps the canvas in a position:relative div on init — overlay into it.
  const wrapper = canvas.parentElement;
  const layer = document.createElement('div');
  layer.className = 'cobe-markers';
  // overflow:hidden clips dots (and their glow) to the canvas box, so they can't
  // spill into the section below — matching how the canvas itself clips.
  layer.style.cssText = 'position:absolute;pointer-events:none;overflow:hidden;';
  wrapper.appendChild(layer);

  // Reuse an element you placed in Webflow ([data-cobe-marker="id"]) if present,
  // otherwise create a default dot. Either way we own its position + opacity.
  const markerEls = markers.map((m) => {
    let el = wrapper.querySelector(`[data-cobe-marker="${m.id}"]`);
    if (!el) {
      el = document.createElement('div');
      el.dataset.cobeMarker = m.id;
      el.className = 'cobe-marker';
      el.innerHTML = '<span class="cobe-marker__dot"></span>';
    }
    layer.appendChild(el); // move into the overlay so all transforms share one origin
    el.style.position = 'absolute';
    el.style.left = '0';
    el.style.top = '0';
    el.style.willChange = 'transform, opacity';
    el.style.setProperty('--cobe-color', rgbToCss(m.color)); // expose colour to CSS
    return { m, el };
  });

  // Keep the overlay layer aligned with the canvas box (CSS px).
  const layoutLayer = () => {
    layer.style.left = `${canvas.offsetLeft}px`;
    layer.style.top = `${canvas.offsetTop}px`;
    layer.style.width = `${canvas.offsetWidth}px`;
    layer.style.height = `${canvas.offsetHeight}px`;
  };
  layoutLayer();

  // Project [lat, lng] to {x, y} CSS px within the layer + a front/back factor,
  // matching cobe's shader so the dots stay locked onto the rendered markers.
  const projectMarker = (loc) => {
    const latR = loc[0] * Math.PI / 180;
    const lngR = loc[1] * Math.PI / 180 - Math.PI;
    const cl = Math.cos(latR);
    const r = 0.8 + markerElevation;
    const ax = -cl * Math.cos(lngR) * r;
    const ay = Math.sin(latR) * r;
    const az = cl * Math.sin(lngR) * r;

    const c = Math.cos(theta), d = Math.sin(theta), e = Math.cos(phi), f = Math.sin(phi);
    const lx = e * ax + f * az;
    const ly = f * d * ax + c * ay - e * d * az;
    const lz = -f * c * ax + d * ay + e * c * az; // > 0 = front hemisphere

    const aspect = height / width;
    const clipX = lx * aspect * scale;
    const clipY = ly * scale - (verticalOffset() * scale) / (height * dpr);

    return {
      x: (clipX * 0.5 + 0.5) * width,
      y: (0.5 - clipY * 0.5) * height,
      visible: smoothstep(0, 0.25, lz), // fade across the limb as it turns away
    };
  };

  const positionMarkers = () => {
    for (const { m, el } of markerEls) {
      const p = projectMarker(m.location);
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = p.visible;
      el.style.setProperty('--cobe-visible', p.visible.toFixed(3));
    }
  };

  // Resize: cobe needs pixel dimensions, so re-feed width/height/offset on change
  const onResize = () => {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    globe.update({ width: width * dpr, height: height * dpr, offset: [0, verticalOffset()] });
    layoutLayer();
  };
  window.addEventListener('resize', onResize);

  // --- Render loop ------------------------------------------------------------
  // This build of cobe has no internal loop — calling update() is what renders a
  // frame, so we drive it ourselves with requestAnimationFrame.
  const render = () => {
    if (pointerDown) {
      // While dragging, phiTarget/thetaTarget follow the pointer (see onPointerMove).
    } else if (Math.abs(phiVel) > 0.0001) {
      phiTarget += phiVel;    // coast with momentum after release
      phiVel *= FRICTION;
    } else {
      phiVel = 0;
      phiTarget += autoSpeed; // resume idle auto-spin once momentum settles
    }

    // Ease the rendered angle toward its target for a smooth, weighty feel.
    phi += (phiTarget - phi) * SMOOTH;

    globe.update({ phi, theta });
    positionMarkers();          // keep HTML overlays locked to the markers
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

function initFOUC() {
  const loadEls = document.querySelectorAll("[data-anim-load]");
  loadEls.forEach((el) => {
    if (el.hasAttribute("data-fouc-prevent")) {
      return;
    } else {
      gsap.set(el, {
        visibility: "visible",
      });
    }
  });
  ScrollTrigger.refresh();
  // lenis.resize();
}

function initTextSplit() {
  const animMap = new WeakMap();

  function handleSplit(el, self) {
    const prev = animMap.get(el);
    if (prev) prev.forEach((anim) => anim.kill());
    animMap.set(el, []);

    el.dispatchEvent(
      new CustomEvent("splitReady", {
        detail: {
          lines: self.lines,
          words: self.words,
          chars: self.chars,
          register(anim) {
            animMap.get(el)?.push(anim);
          },
        },
      })
    );
  }

  const splitConfig = {
    chars: {
      type: "chars, lines",
      mask: "chars",
      charsClass: "char-mask",
      linesClass: "line-mask",
      autoSplit: true,
    },
    words: {
      type: "words, lines",
      mask: "lines",
      wordsClass: "word-mask",
      linesClass: "line-mask",
      autoSplit: true,
    },
    lines: {
      type: "lines",
      mask: "lines",
      linesClass: "line-mask",
      autoSplit: true,
    },
    "rich-lines": {
      type: "lines",
      mask: "lines",
      linesClass: "line-mask",
      autoSplit: true,
    },
  };

  Object.entries(splitConfig).forEach(([key, config]) => {
    document.querySelectorAll(`[data-split="${key}"]`).forEach((el) => {
      const target = key === "rich-lines" ? [...el.children] : el;

      SplitText.create(target, {
        ...config,
        onSplit(self) {
          handleSplit(el, self);
        },
      });
    });
  });
}

function initLoadAnimations() {
  const globalLoadDelay = 0;
    // Lines load animation
  document.querySelectorAll("[data-anim-load=lines]").forEach((el) => {
const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;    el.addEventListener("splitReady", (e) => {
      const { lines, register } = e.detail;
      if (!lines?.length) return;

      const tween = gsap.from(lines, {
        delay: globalLoadDelay + delay,
        opacity: 0,
        yPercent: 112,
        duration: 1.125,
        stagger: 0.075,
        ease: "expo.out",
      });
      register(tween);
    });
  });

  document.querySelectorAll("[data-anim-load=fade]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    gsap.from(el, {
      opacity: 0,
      duration: 1,
      ease: "expo.out",
      delay: globalLoadDelay + delay,
    })
  })

  document.querySelectorAll("[data-anim-load=button]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    gsap.from(el, {
      opacity: 0,
      yPercent: 50,
      duration: 1,
      ease: "power3.out",
      delay: globalLoadDelay + delay,
    })
  })

  document.querySelectorAll("[data-anim-load=inset-section]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    gsap.fromTo(el, {
            clipPath: "inset(0rem 0rem 0rem 0rem round 0rem)",

    }, 
      {
      clipPath: "inset(0.5rem 0.5rem 0.5rem 0.5rem round 1rem)",
      duration: 1.5,
      ease: "power2.out",
      delay: globalLoadDelay + delay,
    })
  })

  document.querySelectorAll("[data-anim-load=children-fade]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    gsap.from(el.children, {
      opacity: 0,
      yPercent: 50,
      duration: 1.5,
      stagger: {
        each: 0.075,
      },
      ease: "expo.out",
      delay: globalLoadDelay + delay,
    })
  })

  // Words load animation
  document.querySelectorAll("[data-anim-load=words]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    el.addEventListener("splitReady", (e) => {
      const { words, register } = e.detail;
      if (!words?.length) return;

      const tween = gsap.from(words, {
        delay: globalLoadDelay + delay,
        yPercent: 115,
        duration: 1,
        stagger: 0.075,
        ease: "power3.out",
      });
      register(tween);
    });
  });
}

function initScrollAnimations() {

    // Words scroll animation
  document.querySelectorAll("[data-anim-scroll=words]").forEach((el) => {
    el.addEventListener("splitReady", (e) => {
      const { words, register } = e.detail;
      if (!words?.length) return;

      const tween = gsap.from(words, {
        yPercent: 115,
        duration: 1,
        stagger: 0.075,
        ease: "power3.out",
                scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top 90%",
          toggleActions: "none play none reset",
        },
      });
      register(tween);
    });
  });

    document.querySelectorAll("[data-anim-scroll=lines]").forEach((el) => {
el.addEventListener("splitReady", (e) => {
      const { lines, register } = e.detail;
      if (!lines?.length) return;

      const tween = gsap.from(lines, {
        opacity: 0,
        yPercent: 112,
        duration: 1.125,
        stagger: 0.075,
        ease: "expo.out",
                        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top 90%",
          toggleActions: "none play none reset",
        },
      });
      register(tween);
    });
  });

    document.querySelectorAll("[data-anim-scroll=children-slide-right-fade]").forEach((el) => {
      const children = el.children;
      const childTargets = el.querySelectorAll("[data-anim-target]");
      const animTargets = childTargets ? childTargets : children;

      gsap.from(children, {
        opacity: 0,
        duration: 1.66,
        yPercent: 25,
        ease: "expo.out",
        stagger: {
          each: 0.075,
        },
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top 80%",
          toggleActions: "none play none reset",
        },
      });
  });

    document.querySelectorAll("[data-anim-scroll=fade]").forEach((el) => {

      gsap.from(el, {
        opacity: 0,
        duration: 1.66,
        yPercent: 25,
        ease: "expo.out",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top 80%",
          toggleActions: "none play none reset",
        },
      });
  });
}

function initGlobalParallax() {
  const mm = gsap.matchMedia()

  mm.add(
    {
      isMobile: "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)"
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions

      const ctx = gsap.context(() => {
        document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
            // Check if this trigger has to be disabled on smaller breakpoints
            const disable = trigger.getAttribute("data-parallax-disable")
            if (
              (disable === "mobile" && isMobile) ||
              (disable === "mobileLandscape" && isMobileLandscape) ||
              (disable === "tablet" && isTablet)
            ) {
              return
            }
            
            // Optional: you can target an element inside a trigger if necessary 
            const target = trigger.querySelector('[data-parallax="target"]') || trigger

            // Get the direction value to decide between xPercent or yPercent tween
            const direction = trigger.getAttribute("data-parallax-direction") || "vertical"
            const prop = direction === "horizontal" ? "xPercent" : "yPercent"
            
            // Get the scrub value, our default is 'true' because that feels nice with Lenis
            const scrubAttr = trigger.getAttribute("data-parallax-scrub")
            const scrub = scrubAttr ? parseFloat(scrubAttr) : true
            
            // Get the start position in % 
            const startAttr = trigger.getAttribute("data-parallax-start")
            const startVal = startAttr !== null ? parseFloat(startAttr) : 20
            
            // Get the end position in %
            const endAttr = trigger.getAttribute("data-parallax-end")
            const endVal = endAttr !== null ? parseFloat(endAttr) : -20
            
            // Get the start value of the ScrollTrigger
            const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom"
            const scrollStart = `clamp(${scrollStartRaw})`
            
           // Get the end value of the ScrollTrigger  
            const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") || "bottom top"
            const scrollEnd = `clamp(${scrollEndRaw})`

            gsap.fromTo(
              target,
              { [prop]: startVal },
              {
                [prop]: endVal,
                ease: "none",
                scrollTrigger: {
                  trigger,
                  start: scrollStart,
                  end: scrollEnd,
                  scrub,
                },
              }
            )
          })
      })

      return () => ctx.revert()
    }
  )
    }
	
function initSwipers() {
      $("[data-swiper=case-studies]").each(function() {
        const swiperTarget = $(this)[0];
        const swiperNext = $("[data-swiper-next=case-studies]")[0];
        const swiperPrev = $("[data-swiper-prev=case-studies]")[0];

        const swiper = new Swiper(swiperTarget, {
          modules: [Navigation],
          speed: 600,
          spaceBetween: 15,
          slidesPerView: "auto",
          navigation: {
            nextEl: swiperNext,
            prevEl: swiperPrev,
          },
          mousewheel: {
            forceToAxis: true,
          },
          a11y: {
            enabled: true,
            slideRole: 'listitem'
          },
        })
      })

      const swiperCaseStudiesFull = document.querySelectorAll("[data-swiper=case-studies-full]");
      swiperCaseStudiesFull.forEach((swiperEl) => {
        const swiperNext = document.querySelector("[data-swiper-next=case-studies-full]");
        const swiperPrev = document.querySelector("[data-swiper-prev=case-studies-full]");
        const swiperScroll = document.querySelector("[data-swiper-scrollbar=case-studies-full]");
        
        const swiper = new Swiper(swiperEl, {
                    modules: [Navigation, Scrollbar],
          speed: 600,
          spaceBetween: 32,
          slidesPerView: "auto",
          grabCursor: true,
          navigation: {
            nextEl: swiperNext,
            prevEl: swiperPrev,
            disabledClass: "is-disabled",
          },
          scrollbar: {
            el: swiperScroll,
            draggable: true,
          },
          mousewheel: {
            forceToAxis: true,
          },
          a11y: {
            enabled: true,
            slideRole: 'listitem'
          },
        })

      })
    }

    function initMouseMove() {
  var MAX_REM = 10;
  var maxPx =
    MAX_REM * parseFloat(getComputedStyle(document.documentElement).fontSize);

  // Bail on touch devices
  if ("ontouchstart" in window) return;

  var targets = [];

  $("[data-mouse-move-strength]").each(function () {
    var el = $(this)[0];
    var strength = parseFloat($(this).attr("data-mouse-move-strength")) || 0;

    targets.push({
      strength: strength,
      xTo: gsap.quickTo(el, "x", { duration: 1.5, ease: "power3" }),
      yTo: gsap.quickTo(el, "y", { duration: 1.5, ease: "power3" }),
    });
  });

  if (!targets.length) return;

  $(window).on("mousemove", function (e) {
    // -1 … 1 from viewport center
    var nx = (e.clientX / window.innerWidth - 0.5) * 2;
    var ny = (e.clientY / window.innerHeight - 0.5) * 2;

    targets.forEach(function (t) {
      t.xTo(nx * -maxPx * t.strength);
      t.yTo(ny * -maxPx * t.strength);
    });
  });
}

// Resource
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const initFlag = 'data-odometer-initialized'
  const activeTweens = new WeakMap()

  // Configuration
  const defaults = {
    duration: 2,
    ease: 'power3.out',
    elementStagger: 0.05,
    digitStagger: 0.04,
    revealDuration: 1,
    revealEase: 'power2.out',
    triggerStart: 'top 90%',
    staggerOrder: 'left',
    digitCycles: 2
  }

  // Scroll-triggered groups
  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return
    group.setAttribute(initFlag, '')

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'))
    if (!elements.length || prefersReducedMotion) return

    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger

    const elementData = elements.map(el => {
      const originalText = el.textContent.trim()
      const hasExplicitStart = el.hasAttribute('data-odometer-start')
      const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0
      const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration
      const step = getLineHeightRatio(el)

      let segments = parseSegments(originalText)
      segments = mapStartDigits(segments, startValue)
      segments = markHiddenSegments(segments, startValue)

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments)
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow)

      const fontSize = parseFloat(getComputedStyle(el).fontSize)
      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize
        gsap.set(revealEl, { width: 0, overflow: 'hidden' })
        return { el: revealEl, widthEm }
      })

      return { el, rollers, duration, step, revealData, originalText }
    })

    const ordered = applyStaggerOrder(elementData, staggerOrder)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: "top bottom",
        end: triggerStart,
        toggleActions: "none play none reset",
      },
      onComplete() {
        elementData.forEach(({ el, originalText, step }) => {
          cleanupElement(el, originalText)
        })
      }
    })

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data
      const offset = orderIdx * elementStagger

      revealData.forEach(({ el, widthEm }) => {
        tl.to(el, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase
        }, offset)
      })

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx
        tl.to(roller, {
          y: -targetPos * step + 'em',
          duration,
          ease: defaults.ease,
          force3D: true
        }, offset + reversedIdx * defaults.digitStagger)
      })
    })
  })

  // Programmatic update (optional add-on)
  return function updateOdometer(el, newText, options = {}) {
    const currentText = el.textContent.trim()
    if (currentText === newText) return

    const duration = options.duration || defaults.duration
    const ease = options.ease || defaults.ease
    const step = getLineHeightRatio(el)

    // Kill any running animation and clear its inline style locks
    const existing = activeTweens.get(el)
    if (existing) {
      existing.kill()
      gsap.set(el, { clearProps: 'width,overflow' })
    }

    // Measure current width before rebuilding (in em for responsive scaling)
    const fontSize = parseFloat(getComputedStyle(el).fontSize)
    const oldWidthEm = el.getBoundingClientRect().width / fontSize

    // Parse current text as start, new text as end
    const startSegments = parseSegments(currentText)
    const startDigitsStr = startSegments
      .filter(s => s.type === 'digit')
      .map(s => s.char)
      .join('')
    const startValue = parseInt(startDigitsStr, 10) || 0

    let segments = parseSegments(newText)
    segments = mapStartDigits(segments, startValue)
    segments = markHiddenSegments(segments, startValue)
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true)

    // Measure new natural width (in em)
    const newWidthEm = el.getBoundingClientRect().width / fontSize
    const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01

    // Lock to old width for smooth transition
    if (widthChanged) {
      gsap.set(el, { width: oldWidthEm + 'em', overflow: 'hidden' })
    }

    const tl = gsap.timeline({
      onComplete() {
        cleanupElement(el, newText)
        activeTweens.delete(el)
      }
    })
    activeTweens.set(el, tl)

    // Animate element width
    if (widthChanged) {
      tl.to(el, {
        width: newWidthEm + 'em',
        duration: defaults.revealDuration,
        ease: defaults.revealEase
      }, 0)
    }

    // Fade in hidden statics
    revealEls.forEach(revealEl => {
      if (revealEl.getAttribute('data-odometer-part') === 'static') {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0)
      }
    })

    // Roll digits
    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx
      tl.to(roller, {
        y: -targetPos * step + 'em',
        duration,
        ease,
        force3D: true
      }, reversedIdx * defaults.digitStagger)
    })
  }

  // Helpers
  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el)
    const lh = cs.lineHeight
    if (lh === 'normal') return 1.2
    return parseFloat(lh) / parseFloat(cs.fontSize)
  }

  function parseSegments(text) {
    return [...text].map(char => ({
      type: /\d/.test(char) ? 'digit' : 'static',
      char
    }))
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter(s => s.type === 'digit')
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, '0')
      .slice(-digitSlots.length)
    let di = 0
    return segments.map(s =>
      s.type === 'digit'
        ? { ...s, startDigit: parseInt(padded[di++], 10) }
        : s
    )
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits = segments.filter(s => s.type === 'digit').length
    const absStart = Math.floor(Math.abs(startValue))
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length
    const leadingZeros = Math.max(0, totalDigits - startDigitCount)
    if (leadingZeros === 0) return segments
    let digitsSeen = 0
    let firstDigitSeen = false
    let prevDigitHidden = false
    return segments.map(seg => {
      if (seg.type === 'digit') {
        firstDigitSeen = true
        const hidden = digitsSeen < leadingZeros
        prevDigitHidden = hidden
        digitsSeen++
        return { ...seg, hidden }
      }
      const hidden = firstDigitSeen && prevDigitHidden
      return { ...seg, hidden }
    })
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute('data-odometer-grow')) {
      return el.getAttribute('data-odometer-grow') !== 'false'
    }
    if (!hasExplicitStart) return false
    const absStart = Math.floor(Math.abs(startValue))
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length
    const endDigitCount = segments.filter(s => s.type === 'digit').length
    return startDigitCount < endDigitCount
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = ''
    el.style.height = ''
    const rollers = []
    const revealEls = []
    const totalCells = 10 * defaults.digitCycles
    segments.forEach(seg => {
      if (seg.type === 'static') {
        const span = document.createElement('span')
        span.setAttribute('data-odometer-part', 'static')
        span.style.height = step + 'em'
        span.style.lineHeight = step
        span.textContent = seg.char
        el.appendChild(span)
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 })
          revealEls.push(span)
        }
        return
      }
      const mask = document.createElement('span')
      mask.setAttribute('data-odometer-part', 'mask')
      mask.style.height = step + 'em'
      mask.style.lineHeight = step
      const roller = document.createElement('span')
      roller.setAttribute('data-odometer-part', 'roller')
      roller.style.lineHeight = step

      const digits = []
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10)
      }
      roller.textContent = digits.join('\n')
      mask.appendChild(roller)
      el.appendChild(mask)
      const startDigit = seg.startDigit || 0
      const isReveal = grow && seg.hidden
      gsap.set(roller, { y: isReveal ? step + 'em' : -startDigit * step + 'em' })
      const endDigit = parseInt(seg.char, 10)
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit
      rollers.push({ roller, targetPos })
      if (isReveal) revealEls.push(mask)
    })
    return { rollers, revealEls }
  }

  function cleanupElement(el, originalText) {
    el.style.overflow = ''
    el.style.height = ''

    // Remove rollers, set final digit, clear inline bloat (but preserve width)
    const digits = [...originalText].filter(c => /\d/.test(c))
    let di = 0

    el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
      const roller = mask.querySelector('[data-odometer-part="roller"]')
      if (roller) roller.remove()
      mask.textContent = digits[di++] || ''
      mask.style.opacity = ''
      mask.style.overflow = ''
    })

    el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
      stat.style.opacity = ''
    })
  }

  function recalcOnResize() {
    document.querySelectorAll('[data-odometer-element]').forEach(el => {
      // Force-complete any running programmatic animation
      const running = activeTweens.get(el)
      if (running) {
        running.progress(1)
        activeTweens.delete(el)
      }

      const hasRollers = el.querySelector('[data-odometer-part="roller"]')

      if (hasRollers) {
        // Pre-triggered: recalculate step-based inline styles
        const step = getLineHeightRatio(el)
        el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
          mask.style.height = step + 'em'
          mask.style.lineHeight = step
        })
        el.querySelectorAll('[data-odometer-part="roller"]').forEach(roller => {
          roller.style.lineHeight = step
        })
        el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
          stat.style.lineHeight = step
        })
      }
      // Completed elements: width is em-based, scales automatically, don't touch
    })
    ScrollTrigger.refresh()
  }

  let resizeTimer
  let lastWidth = window.innerWidth
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      recalcOnResize()
    }, 250)
  })

  function applyStaggerOrder(items, order) {
    const arr = [...items]
    if (order === 'right') return arr.reverse()
    if (order === 'random') return shuffleArray(arr)
    return arr
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }
}


function initTabSystem() {
  const wrappers = document.querySelectorAll('[data-tabs="wrapper"]');
  
  wrappers.forEach((wrapper) => {
    const contentItems = wrapper.querySelectorAll('[data-tabs="content-item"]');
    const visualItems = wrapper.querySelectorAll('[data-tabs="visual-item"]');
    
    const autoplay = wrapper.dataset.tabsAutoplay === "true";
    const autoplayDuration = parseInt(wrapper.dataset.tabsAutoplayDuration) || 5000;
    
    let activeContent = null; // keep track of active item/link
    let activeVisual = null;
    let isAnimating = false;
    let progressBarTween = null; // to stop/start the progress bar

    function startProgressBar(index) {
      if (progressBarTween) progressBarTween.kill();
      const bar = contentItems[index].querySelector('[data-tabs="item-progress"]');
      if (!bar) return;
      
      // In this function, you can basically do anything you want, that should happen as a tab is active
      // Maybe you have a circle filling, some other element growing, you name it.
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      progressBarTween = gsap.to(bar, {
        scaleX: 1,
        duration: autoplayDuration / 1000,
        ease: "power1.inOut",
        onComplete: () => {
          if (!isAnimating) {
            const nextIndex = (index + 1) % contentItems.length;
            switchTab(nextIndex); // once bar is full, set next to active – this is important
          }
        },
      });
    }

    function switchTab(index) {
      if (isAnimating || contentItems[index] === activeContent) return;
      
      isAnimating = true;
      if (progressBarTween) progressBarTween.kill(); // Stop any running progress bar here
      
      const outgoingContent = activeContent;
      const outgoingVisual = activeVisual;
      const outgoingBar = outgoingContent?.querySelector('[data-tabs="item-progress"]');
      
      const incomingContent = contentItems[index];
      const incomingVisual = visualItems[index];
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');
      
      outgoingContent?.classList.remove("active");
      outgoingVisual?.classList.remove("active");
      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");
      
      const tl = gsap.timeline({
        defaults: { duration: 0.65, ease: "power3" },
        onComplete: () => {
          activeContent = incomingContent;
          activeVisual = incomingVisual;
          isAnimating = false;
          if (autoplay) startProgressBar(index); // Start autoplay bar here
        },
      });
      
      // Wrap 'outgoing' in a check to prevent warnings on first run of the function
      // Of course, during first run (on page load), there's no 'outgoing' tab yet!
      if (outgoingContent) {
        outgoingContent.classList.remove("active");
        outgoingVisual?.classList.remove("active");
        tl.set(outgoingBar, { transformOrigin: "right center" })
          .to(outgoingBar, { scaleX: 0, duration: 0.3 }, 0)
          .to(outgoingVisual, { autoAlpha: 0, yPercent: -5, }, 0)
          .to(outgoingContent.querySelector('[data-tabs="item-details"]'), { height: 0 }, 0);
      }

      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");
      tl.fromTo(incomingVisual, { autoAlpha: 0, yPercent: 5, }, { autoAlpha: 1, yPercent: 0, }, 0.1)
        .fromTo( incomingContent.querySelector('[data-tabs="item-details"]'),{ height: 0 },{ height: "auto" },0)
        .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
    }

    // on page load, set first to active
    // idea: you could wrap this in a scrollTrigger
    // so it will only start once a user reaches this section
    switchTab(0);
    
    // switch tabs on click
    contentItems.forEach((item, i) =>
      item.addEventListener("click", () => {
        if (item === activeContent) return; // ignore click if current one is already active
        switchTab(i);
      })
    );
    
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // visual, font-independent — run immediately
  initButton046();
  initMegaNavDirectionalHover();
  initMediaSetup();
  initNumberOdometer();
  initMouseMove();
  initMarqueeScrollDirection();
  // initLenis();
  initCobe();
  initSwipers();
  initGlobalParallax();
    initTabSystem();


  // font-dependent (SplitText metrics) — gate only these
  document.fonts.ready.then(() => {
      initFOUC();    
        initScrollAnimations();  // non-split scroll fades

          initLoadAnimations();
          // reveal containers ASAP
    initTextSplit();
    // lenis.resize();
  });
});
  

