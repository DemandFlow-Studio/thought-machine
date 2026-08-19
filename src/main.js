import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/all';
import Lenis from 'lenis';
import createGlobe from './lib/cobe-custom.js';
import Swiper from 'swiper';
import { Navigation, Scrollbar, Keyboard, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import Core from "smooothy";


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
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate } = marquee.dataset;

    // Convert data attributes to usable types
    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? -1 : -1; // 1 for right, -1 for left
    const duplicateAmount = parseInt(duplicate || 0);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Duplicate marquee content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    // Restore any logo images the consent blocker parked before we cloned them.
    // It moves the real URL into data-cookieblock-src and only restores src on the
    // original nodes it scanned — never on our clones — so copy it back on any img
    // that's still missing a src. First-party logos, so no consent concern.
    marquee.querySelectorAll('img[data-cookieblock-src]').forEach((img) => {
      if (!img.getAttribute('src')) {
        img.setAttribute('src', img.getAttribute('data-cookieblock-src'));
      }
    });

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

    // ScrollTrigger logic: the marquee always travels in its base direction.
    // Scrolling (up OR down) only adds a slight speed boost in that same
    // direction, which eases back to normal once scrolling settles.
    const speedProxy = { boost: 1 };
    let decayTween;

    const applyTimeScale = () =>
      animation.timeScale(marqueeDirectionAttr * speedProxy.boost);

    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        // Absolute velocity → scrolling either way accelerates, never reverses.
        const velocity = Math.abs(self.getVelocity());
        const targetBoost = 1 + Math.min(velocity / 2000, 1); // 1x–2x, kept subtle

        decayTween?.kill();
        speedProxy.boost = targetBoost;
        applyTimeScale();

        // Ease the speed back down to normal once scrolling stops.
        decayTween = gsap.to(speedProxy, {
          boost: 1,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: applyTimeScale,
        });
      }
    });
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


// --- Globe geometry (pure math) ----------------------------------------------
// Projection and interpolation only — no globe settings live here, so nothing in
// this block decides how any globe looks. Each globe owns its own point scatter
// and arc builder further down, and those are deliberately not shared: retuning
// one globe must never move the other.

const GLOBE_RADIUS = 0.8;   // cobe's sphere radius, in its own world units

// [lat, lng] -> world vector, mirroring cobe's internal projection so the
// fromVec/toVec we hand it land exactly where a from/to pair would have.
function latLngToWorld([lat, lng]) {
  const latR = lat * Math.PI / 180;
  const lngR = lng * Math.PI / 180 - Math.PI;
  const cl = Math.cos(latR);
  return [-cl * Math.cos(lngR), Math.sin(latR), cl * Math.sin(lngR)];
}

// Great-circle interpolation between two unit vectors — the segments have to
// follow the sphere, otherwise the chain cuts a straight line through the globe.
function slerpDir(a, b, t) {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const angle = Math.acos(dot) * t;
  const rel = [b[0] - a[0] * dot, b[1] - a[1] * dot, b[2] - a[2] * dot];
  const len = Math.hypot(rel[0], rel[1], rel[2]);
  if (len < 1e-6) return a;   // coincident points — nothing to interpolate along
  const ca = Math.cos(angle), sa = Math.sin(angle);
  return [
    a[0] * ca + (rel[0] / len) * sa,
    a[1] * ca + (rel[1] / len) * sa,
    a[2] * ca + (rel[2] / len) * sa,
  ];
}

function mixColor(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

// --- Section globe arcs (initCobe only) --------------------------------------
// cobe paints each arc in a single flat colour, so a blue→purple fade can't be
// done with one arc; buildGradientArcs() draws every pair as a chain of short arcs
// laid end to end along one lifted great-circle path, each a step further along
// the ramp — read together they look like a single gradient arc. The hero globe
// has its own pair of these (makeHeroArcPoints / buildHeroArcs) further down.

// A dispersed, lightly-randomised set of points (regenerated on each load), paired
// off into arcs. Latitudes are biased to the upper hemisphere since only the top of
// the section globe's dome is in view (the hero, which sits fully in frame, scatters
// over the whole sphere instead — see makeHeroArcPoints), and longitudes are
// evenly spread + jittered so points don't
// cluster. `count` must be even — every dot gets exactly one arc (so none is left
// unconnected) and the arcs don't chain through shared endpoints. One end of each
// pair is colorA and the other colorB, so the arc fades between them and the HTML
// dots (which read marker.color) match the arc end they sit on.
// Swap the result for a fixed array of { id, location:[lat,lng], color } to pin them.
function makeArcPoints({ count = 8, colorA, colorB, latMin = 22, latMax = 68, jitter = 12, size = 0.05, idPrefix = 'pt' }) {
  const rand = (min, max) => min + Math.random() * (max - min);
  const markers = Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i}`,
    location: [rand(latMin, latMax), -180 + (360 / count) * i + rand(-jitter, jitter)],
    size,
    color: colorA, // reassigned per pair below
  }));

  const shuffled = markers.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    shuffled[i].color = colorA;
    shuffled[i + 1].color = colorB;
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  return { markers, pairs };
}

// segments: more = smoother fade, more draw instances per arc.
// height:   apex lift of the path, in cobe's units (its own `arcHeight` scale).
function buildGradientArcs(pairs, { segments = 16, height = 0.33, elevation = 0 } = {}) {
  // Point on the path at t: the great-circle direction pushed out by a sine bow, so
  // the chain arches off the surface and touches back down on both dots. The 0.5
  // puts the apex where cobe's own quadratic bow sat for the same height.
  const pointAt = (a, b, t) => {
    const d = slerpDir(a, b, t);
    const r = GLOBE_RADIUS + elevation + height * 0.5 * Math.sin(Math.PI * t);
    return [d[0] * r, d[1] * r, d[2] * r];
  };

  const arcs = [];
  for (const [fromM, toM] of pairs) {
    const a = latLngToWorld(fromM.location);
    const b = latLngToWorld(toM.location);
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const tm = (t0 + t1) / 2;
      const mid = pointAt(a, b, tm);
      arcs.push({
        // PATCHED options: endpoints as world vectors (so a segment can start and
        // end above the surface) plus a per-segment bow height. Each segment bows
        // only as far as the path has already risen at its own midpoint, so the
        // chain reads as one smooth curve rather than a row of scallops.
        fromVec: pointAt(a, b, t0),
        toVec: pointAt(a, b, t1),
        height: Math.hypot(mid[0], mid[1], mid[2]) - GLOBE_RADIUS - elevation,
        color: mixColor(fromM.color, toM.color, tm),
      });
    }
  }
  return arcs;
}

function initCobe() {
  const canvas = document.querySelector('[data-cobe-canvas]');
  if (!canvas) return;

  const isLightMode = canvas.hasAttribute('data-theme-light');

  // Skip on mobile (run on tablet and up). 768px is Webflow's tablet breakpoint —
  // mobile landscape tops out at 767px, so < 768 = phone.
  if (window.innerWidth < 768) return;

  // Cap DPR at 2 — anything higher just burns GPU with no visible gain
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cobe expects colors as 0–1 RGB triplets, not 0–255
  const BLUE = [0.16, 0.55, 1];
  const PURPLE = [0.62, 0.24, 1];

  const { markers, pairs } = makeArcPoints({ count: 8, colorA: BLUE, colorB: PURPLE });

  // --- Sizing -----------------------------------------------------------------
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;

  // Push the globe down so only the upper "dome" sits in view — pair this with
  // your bottom gradient mask in CSS for the faded-horizon look.
  // CSS px — cobe multiplies the offset by devicePixelRatio internally.
  // globeOffset() is the single source of truth for where the globe sits: the
  // createGlobe call, the resize handler and the HTML dot projection all read it,
  // so changing it here moves the canvas globe and its dots together.
  const horizontalOffset = () => 0;
  const verticalOffset = () => height * (isLightMode ? 0.5 : 0.575);
  const globeOffset = () => [horizontalOffset(), verticalOffset()];

  // Shared with the HTML overlay projection below, so the dots stay locked to the
  // rendered markers. Keep these in sync with the createGlobe options.
  const scale = 3;
  const markerElevation = 0;


  // Arcs bow off the surface and fade blue→pink along their length (the helpers up
  // top do the work). Light mode runs without them — undefined leaves cobe's arc
  // buffer empty.
  const arcs = isLightMode ? undefined : buildGradientArcs(pairs, { elevation: markerElevation });

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
    width,                          // CSS px — cobe multiplies by devicePixelRatio
    height,                         // internally (passing width*dpr here would render at dpr²)
    phi: 0,                         // start azimuth; driven by the render loop after
    theta,                          // start tilt (vertical angle)
    dark: isLightMode ? 0 : 1,        // 1 = dark mode: the DOTS are the lit element, so landColor colours the dots
                                    //                 themselves. 0 = light mode: dots are dark holes in a lit field.
    diffuse: 1.2,                   // 0..~2 — directional shading; lower = flatter (less night-side falloff)
    mapSamples: 18000,              // number of dots sampled across the map (density)
    mapBrightness: 8,               // brightness of the COUNTRY dots — raise for lighter
    mapBaseBrightness: 0,           // brightness of the OCEAN dots — 0 = only continents show on the solid fill
    baseColor: [0.09803921568627451, 0.09803921568627451, 0.09803921568627451],   // colour of the ocean dots (only shows if mapBaseBrightness > 0)
    landColor: [0.1, 0.1, 0.1],  // PATCHED option: colour of the COUNTRY dots, independent of baseColor
    baseFill: isLightMode ? [1, 1, 1] : [0.09803921568627451, 0.09803921568627451, 0.09803921568627451],     // PATCHED option: solid sphere colour behind the dots (your old base grey)
    markerColor: BLUE,              // fallback for markers without their own color
    glowColor: isLightMode ? [1, 1, 1] : [0.09803921568627451, 0.09803921568627451, 0.09803921568627451], // atmosphere rim glow
    arcColor: BLUE,                 // fallback for arcs without their own color
    arcWidth: 0.1,                  // thickness of the arc lines
    arcHeight: 0,                   // unused — each gradient segment carries its own
                                    // `height` (see the arc builder above)
    markerElevation,                // how far markers float above the surface
    opacity: 1,                     // 0..1 — overall globe opacity
    scale,                          // zoom — larger fills more of the section
    offset: globeOffset(),          // [x, y] px shift of the globe within the canvas
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
      '.cobe-marker :where(.cobe-marker__dot){display:block;width:13px;height:13px;' +
      'border-radius:9999px;background:var(--cobe-color,#4ea3ff);' +
      'box-shadow:0 0 12px 1px var(--cobe-color,#4ea3ff);}';
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
    const clipX = lx * aspect * scale + (horizontalOffset() * scale) / width;
    const clipY = ly * scale - (verticalOffset() * scale) / height;

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
    globe.update({ width, height, offset: globeOffset() });
    layoutLayer();
  };
  window.addEventListener('resize', onResize);

  // --- Render loop ------------------------------------------------------------
  // This build of cobe has no internal loop — calling update() is what renders a
  // frame, so we drive it ourselves with requestAnimationFrame. The loop only
  // runs while the canvas is near the viewport: off-screen the globe freezes on
  // its last frame and costs nothing (no WebGL draw, no marker style writes).
  let rafId = null;

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
    rafId = requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (rafId === null) rafId = requestAnimationFrame(render);
  };
  const stopLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Place the overlay dots once so they're correct even before the loop first
  // runs (createGlobe already drew the first canvas frame on init).
  positionMarkers();

  // Fires immediately with the initial state, so the loop starts (or stays off)
  // on load without an explicit first call. rootMargin gives a small head start
  // so the globe is already spinning as it scrolls into view.
  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()),
    { rootMargin: '15% 0px' }
  ).observe(canvas);
}


// A second globe, for the hero. Same mechanics as initCobe() — same arcs, same
// dots, same drag/inertia — but on a light base, and the land dots aren't grey:
// each one picks its colour out of a blue→pink gradient laid across the globe.
// The gradient lives in screen space (see landGradient in cobe-custom.js), so it
// behaves like a gradient sitting BEHIND the globe that the dots mask, rather than
// paint stuck to the map — the ramp stays put while the globe turns underneath it.
// --- Hero globe arcs (initHomeCobe only) -------------------------------------
// Deliberate copies of the section globe's two arc helpers, with the hero's own
// defaults. Retune anything here and only the hero moves.

// Points scattered over the WHOLE sphere rather than hugging the upper hemisphere:
// the hero sits fully in frame, so its arcs should read as wrapping all the way
// around it. Latitudes are sampled uniformly by AREA (pick sin(lat) flat, then
// asin it back) — sampling the angle directly would crowd the poles — and
// longitudes are fully random rather than evenly spaced, so the scatter looks
// unplanned. Narrow latMin/latMax (or lngMin/lngMax) to pull the points into a band.
// `count` must be even — every dot gets exactly one arc (so none is left
// unconnected) and the arcs don't chain through shared endpoints. One end of each
// pair is colorA and the other colorB, so the arc fades between them and the HTML
// dots (which read marker.color) match the arc end they sit on.
function makeHeroArcPoints({
  count = 8,
  colorA,
  colorB,
  latMin = -72,   // full sphere, minus the very poles where arcs get pinched
  latMax = 72,
  lngMin = -180,
  lngMax = 180,
  size = 0.05,
  idPrefix = 'hero-pt',
} = {}) {
  const rand = (min, max) => min + Math.random() * (max - min);
  const sinMin = Math.sin(latMin * Math.PI / 180);
  const sinMax = Math.sin(latMax * Math.PI / 180);
  const randLat = () => Math.asin(rand(sinMin, sinMax)) * 180 / Math.PI;

  const markers = Array.from({ length: count }, (_, i) => ({
    id: `${idPrefix}-${i}`,
    location: [randLat(), rand(lngMin, lngMax)],
    size,
    color: colorA, // reassigned per pair below
  }));

  const shuffled = markers.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const pairs = [];
  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    shuffled[i].color = colorA;
    shuffled[i + 1].color = colorB;
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  return { markers, pairs };
}

// The hero's own gradient-arc chain: every pair drawn as a run of short arcs laid
// end to end along one lifted great-circle path, each a step further along the
// blue→pink ramp, because cobe paints a single arc in one flat colour. Same
// construction as the section globe's buildGradientArcs(), kept separate so the
// segment count and bow height are the hero's to change.
// segments: more = smoother fade, more draw instances per arc.
// height:   apex lift of the path, in cobe's units (its own `arcHeight` scale).
function buildHeroArcs(pairs, { segments = 16, height = 0.33, elevation = 0 } = {}) {
  const pointAt = (a, b, t) => {
    const d = slerpDir(a, b, t);
    const r = GLOBE_RADIUS + elevation + height * 0.5 * Math.sin(Math.PI * t);
    return [d[0] * r, d[1] * r, d[2] * r];
  };

  const arcs = [];
  for (const [fromM, toM] of pairs) {
    const a = latLngToWorld(fromM.location);
    const b = latLngToWorld(toM.location);
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const tm = (t0 + t1) / 2;
      const mid = pointAt(a, b, tm);
      arcs.push({
        // PATCHED options: endpoints as world vectors (so a segment can start and
        // end above the surface) plus a per-segment bow height, so the chain reads
        // as one smooth curve rather than a row of scallops.
        fromVec: pointAt(a, b, t0),
        toVec: pointAt(a, b, t1),
        height: Math.hypot(mid[0], mid[1], mid[2]) - GLOBE_RADIUS - elevation,
        color: mixColor(fromM.color, toM.color, tm),
      });
    }
  }
  return arcs;
}

function initHomeCobe() {
  const canvas = document.querySelector('[data-hero-cobe-canvas]');
  if (!canvas) return;

  // Skip on mobile (run on tablet and up). 768px is Webflow's tablet breakpoint —
  // mobile landscape tops out at 767px, so < 768 = phone.
  // if (window.innerWidth < 768) return;

  // Cap DPR at 2 — anything higher just burns GPU with no visible gain
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // cobe expects colors as 0–1 RGB triplets, not 0–255
  const BLUE = [0.16, 0.55, 1];
  const PINK = [0.62, 0.24, 1];

  // Axis the blue→pink ramp runs along, [x, y] with +y up, in the globe's own disk
  // space. Rotate it to swing the gradient around; lengthen it past 1 to tighten the
  // ramp into a narrower band, shorten it to spread the fade over more of the globe.
  const GRADIENT_AXIS = [1, 0.35];

  const { markers, pairs } = makeHeroArcPoints({ count: 12, colorA: BLUE, colorB: PINK });

  // --- Sizing -----------------------------------------------------------------
  let width = canvas.offsetWidth;
  let height = canvas.offsetHeight;

  // Push the globe down so only the upper "dome" sits in view — pair this with
  // your bottom gradient mask in CSS for the faded-horizon look.
  // CSS px — cobe multiplies the offset by devicePixelRatio internally.
  // globeOffset() is the single source of truth for where the globe sits: the
  // createGlobe call, the resize handler and the HTML dot projection all read it,
  // so changing it here moves the canvas globe and its dots together.
  const horizontalOffset = () => width / 2;
  const verticalOffset = () => height * 0.5;
  const globeOffset = () => [horizontalOffset(), verticalOffset()];

  // Shared with the HTML overlay projection below, so the dots stay locked to the
  // rendered markers. Keep these in sync with the createGlobe options.
  const scale = 1.5;
  const markerElevation = 0;

  // Arcs bow off the surface and fade blue→pink along their length. Pass
  // `arcs: undefined` below if the hero should be dots-only.
  const arcs = buildHeroArcs(pairs, { elevation: markerElevation });

  // --- Rotation, drag & inertia -----------------------------------------------
  // The hero rotates on axes of its own choosing. `gamma` is a PATCHED third angle
  // (see cobe-custom.js): a roll about the SCREEN's z-axis, applied after phi and
  // theta, so the pole — and with it the axis the globe visibly turns around — can
  // be tilted off vertical, which phi/theta alone can't do.
  //
  // REST is the pose the globe sits in before anything moves it. AUTO_SPIN is how
  // far each angle advances per idle frame, and DRAG is the share of a drag each
  // angle takes, so the spin axis and the drag axis are set independently:
  //   spin around a tilted axis → rate on `phi`, tilt via REST.gamma / REST.theta
  //   tumble end over end       → rate on `theta`
  //   roll in the picture plane → rate on `gamma`
  // Rates can be combined; the sum is what you see.
  const REST = { phi: 0, theta: -0.125, gamma: 0.125 };
  const AUTO_SPIN = { phi: 0.00125, theta: 0, gamma: 0 };  // radians per idle frame
  const DRAG = { phi: 1, theta: 0, gamma: 0 };             // share of the drag per angle

  // One accumulator for the idle spin and one for the drag; both fan out onto the
  // three angles through the weights above. `drag` eases toward `dragTarget` each
  // frame so dragging feels weighty rather than instantaneous, and on release
  // `dragVel` carries the last drag speed and decays before the spin resumes.
  let spin = 0;            // idle frames accumulated
  let drag = 0;            // rendered drag offset (radians)
  let dragTarget = 0;      // where drag / inertia wants it to be
  let dragVel = 0;         // angular velocity used for post-release momentum
  let pointerDown = false;
  let lastX = 0;

  // Current value of one angle: rest pose + idle spin + drag.
  const angleAt = (axis) => REST[axis] + spin * AUTO_SPIN[axis] + drag * DRAG[axis];

  const autoSpin = reduceMotion ? 0 : 1;  // multiplier on AUTO_SPIN (0 = held still)
  const DRAG_SENS = 0.0025;   // radians of rotation per px dragged
  const SMOOTH = 0.06;        // 0..1 ease toward target each frame (higher = snappier)
  const FRICTION = 0.975;     // momentum decay per frame after release (lower = stops sooner)

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none'; // let us own the drag gesture on touch devices

  const onPointerDown = (e) => {
    pointerDown = true;
    lastX = e.clientX;
    dragVel = 0;           // cancel leftover momentum when grabbed
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!pointerDown) return;
    const dx = e.clientX - lastX;     // horizontal drag only — vertical is ignored
    lastX = e.clientX;
    dragTarget += dx * DRAG_SENS;
    dragVel = dx * DRAG_SENS;         // last movement seeds the release momentum
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
    width,                          // CSS px — cobe multiplies by devicePixelRatio
    height,                         // internally (passing width*dpr here would render at dpr²)
    phi: REST.phi,                  // start angles; the render loop drives them after
    theta: REST.theta,              // tilt (vertical angle)
    gamma: REST.gamma,              // PATCHED option: roll about the screen's z-axis,
                                    // applied after phi/theta — tilts the spin axis
    dark: 0,                        // ignored while dotMix is 1 — the dots here are
                                    // neither lit nor unlit, they're painted on top
    dotMix: 1,                      // PATCHED option: paint the dots ONTO baseFill
                                    // instead of adding to it. Required for coloured
                                    // dots on a light globe — cobe's own dark:1 adds
                                    // to the fill (colour + white washes out) and
                                    // dark:0 subtracts (blue would come out orange).
    diffuse: 0.2,                   // 0..~2 — directional shading; also fades the dots
                                    // out toward the limb, so the sphere reads round
    mapSamples: 18000,              // number of dots sampled across the map (density)
    mapBrightness: 6,               // in dotMix mode this is how far each dot spreads
                                    // before it saturates — i.e. the dot size
    mapBaseBrightness: 0,           // brightness of the OCEAN dots — 0 = continents only
    baseColor: [1, 1, 1],           // colour of the ocean dots (only shows if mapBaseBrightness > 0)
    landColor: BLUE,                // PATCHED: start of the land-dot gradient
    landColorEnd: PINK,             // PATCHED: end of it — omit for a flat landColor
    landGradient: GRADIENT_AXIS,    // PATCHED: which way the ramp runs (screen space)
    baseFill: [1, 1, 1],            // PATCHED option: solid sphere colour behind the dots
    markerColor: BLUE,              // fallback for markers without their own color
    glowColor: [1, 1, 1],           // atmosphere rim glow — white keeps the limb light
    arcColor: BLUE,                 // fallback for arcs without their own color
    arcWidth: 0.1,                  // thickness of the arc lines
    arcHeight: 0,                   // unused — each gradient segment carries its own
                                    // `height` (see buildHeroArcs)
    markerElevation,                // how far markers float above the surface
    opacity: 1,                     // 0..1 — overall globe opacity
    scale,                          // zoom — larger fills more of the section
    offset: globeOffset(),          // [x, y] px shift of the globe within the canvas
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
      '.cobe-marker :where(.cobe-marker__dot){display:block;width:13px;height:13px;' +
      'border-radius:9999px;background:var(--cobe-color,#4ea3ff);' +
      'box-shadow:0 0 12px 1px var(--cobe-color,#4ea3ff);}';
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
  const projectMarker = (loc, phi, theta, gamma) => {
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

    // Roll about the screen z-axis, matching the gamma the shaders apply after
    // phi/theta. lz is left alone — a roll never moves a point front-to-back.
    const gc = Math.cos(gamma), gs = Math.sin(gamma);
    const rx = gc * lx - gs * ly;
    const ry = gs * lx + gc * ly;

    const aspect = height / width;
    const clipX = rx * aspect * scale + (horizontalOffset() * scale) / width;
    const clipY = ry * scale - (verticalOffset() * scale) / height;

    return {
      x: (clipX * 0.5 + 0.5) * width,
      y: (0.5 - clipY * 0.5) * height,
      visible: smoothstep(0, 0.25, lz), // fade across the limb as it turns away
    };
  };

  const positionMarkers = () => {
    // Read the angles once per frame rather than once per marker.
    const phi = angleAt('phi'), theta = angleAt('theta'), gamma = angleAt('gamma');
    for (const { m, el } of markerEls) {
      const p = projectMarker(m.location, phi, theta, gamma);
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = p.visible;
      el.style.setProperty('--cobe-visible', p.visible.toFixed(3));
    }
  };

  // Resize: cobe needs pixel dimensions, so re-feed width/height/offset on change
  const onResize = () => {
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    globe.update({ width, height, offset: globeOffset() });
    layoutLayer();
  };
  window.addEventListener('resize', onResize);

  // --- Render loop ------------------------------------------------------------
  // This build of cobe has no internal loop — calling update() is what renders a
  // frame, so we drive it ourselves with requestAnimationFrame. The loop only
  // runs while the canvas is near the viewport: off-screen the globe freezes on
  // its last frame and costs nothing (no WebGL draw, no marker style writes).
  let rafId = null;

  const render = () => {
    if (pointerDown) {
      // While dragging, dragTarget follows the pointer (see onPointerMove).
    } else if (Math.abs(dragVel) > 0.0001) {
      dragTarget += dragVel;  // coast with momentum after release
      dragVel *= FRICTION;
    } else {
      dragVel = 0;
      spin += autoSpin;       // resume idle auto-spin once momentum settles
    }

    // Ease the rendered drag offset toward its target for a weighty feel.
    drag += (dragTarget - drag) * SMOOTH;

    globe.update({
      phi: angleAt('phi'),
      theta: angleAt('theta'),
      gamma: angleAt('gamma'),
    });
    positionMarkers();          // keep HTML overlays locked to the markers
    rafId = requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (rafId === null) rafId = requestAnimationFrame(render);
  };
  const stopLoop = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Place the overlay dots once so they're correct even before the loop first
  // runs (createGlobe already drew the first canvas frame on init).
  positionMarkers();

  // Fires immediately with the initial state, so the loop starts (or stays off)
  // on load without an explicit first call. rootMargin gives a small head start
  // so the globe is already spinning as it scrolls into view.
  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? startLoop() : stopLoop()),
    { rootMargin: '15% 0px' }
  ).observe(canvas);
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
    // animMap.set(el, []);

    const anims = [];
    animMap.set(el, anims);

    el.dispatchEvent(
      new CustomEvent("splitReady", {
        detail: {
          lines: self.lines,
          words: self.words,
          chars: self.chars,
          register(anim) {
            // animMap.get(el)?.push(anim);
            anims.push(anim)
          },
        },
      })
    );

    if (!anims.length) return;
    if (anims.length === 1) return anims[0];
    const tl = gsap.timeline();
    anims.forEach((a) => tl.add(a, 0));
    return tl;
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
          return handleSplit(el, self);
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

  document.querySelectorAll("[data-anim-load=diagonal-mask]").forEach((el) => {
    const delay = parseFloat(el.getAttribute("data-anim-load-delay")) || 0;
    gsap.fromTo(el, {
      clipPath: "polygon(0% 0%, 0% 0%, -100% 100%, 0% 100%)",
    }, {
      clipPath: "polygon(0% 0%, 200% 0%, 100% 100%, 0% 100%)",
      duration: 2,
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

    document.querySelectorAll("[data-anim-scroll=children-slide-up-fade]").forEach((el) => {
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
      document.querySelectorAll("[data-swiper=case-studies]").forEach((swiperTarget) => {
        const swiperNext = document.querySelector("[data-swiper-next=case-studies]");
        const swiperPrev = document.querySelector("[data-swiper-prev=case-studies]");

        const swiper = new Swiper(swiperTarget, {
          modules: [Navigation],
          speed: 600,
          spaceBetween: 15,
          slidesPerView: "auto",
          navigation: {
            nextEl: swiperNext,
            prevEl: swiperPrev,
            disabledClass: "is-disabled",
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

      const swiperCaseStudiesCarousel = document.querySelectorAll("[data-swiper=case-studies-carousel]");
      swiperCaseStudiesCarousel.forEach((swiperEl) => {
        const swiper = new Swiper(swiperEl, {
          modules: [Keyboard, Mousewheel],
          speed: 600,
          spaceBetween: 0,
          slidesPerView: 2.25,
          centeredSlides: true,
          loop: true,
          grabCursor: true,
          keyboard: {
            enabled: true,
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

  document.querySelectorAll("[data-mouse-move-strength]").forEach(function (el) {
    var strength = parseFloat(el.getAttribute("data-mouse-move-strength")) || 0;

    targets.push({
      strength: strength,
      xTo: gsap.quickTo(el, "x", { duration: 1.5, ease: "power3" }),
      yTo: gsap.quickTo(el, "y", { duration: 1.5, ease: "power3" }),
    });
  });

  if (!targets.length) return;

  window.addEventListener("mousemove", function (e) {
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
    // Open tabs on hover instead of click when data-tabs-trigger="hover"
    const openOnHover = wrapper.dataset.tabsTrigger === "hover";
    
    let activeContent = null; // keep track of active item/link
    let activeVisual = null;
    let switchTween = null; // the in-flight tab transition, so we can interrupt it
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
          const nextIndex = (index + 1) % contentItems.length;
          switchTab(nextIndex); // once bar is full, set next to active – this is important
        },
      });
    }

    function switchTab(index) {
      if (contentItems[index] === activeContent) return; // already active – nothing to do

      // Interrupt anything mid-flight so hover/click feels instant instead of
      // being blocked until the previous transition finishes.
      if (switchTween) switchTween.kill();
      if (progressBarTween) progressBarTween.kill();

      const incomingContent = contentItems[index];
      const incomingVisual = visualItems[index];
      const incomingBar = incomingContent.querySelector('[data-tabs="item-progress"]');
      const incomingDetails = incomingContent.querySelector('[data-tabs="item-details"]');

      // Commit the new active refs immediately (not in onComplete) so a rapid
      // re-trigger mid-animation still resolves the correct outgoing state.
      activeContent = incomingContent;
      activeVisual = incomingVisual;

      const tl = gsap.timeline({
        defaults: { duration: 0.65, ease: "power3" },
        onComplete: () => {
          switchTween = null;
          if (autoplay) startProgressBar(index); // Start autoplay bar here
        },
      });
      switchTween = tl;

      // Collapse every non-active item. Iterating all of them (rather than a
      // single "outgoing") keeps things consistent when a previous switch was
      // interrupted part-way and left more than one item open.
      contentItems.forEach((item, i) => {
        if (i === index) return;
        item.classList.remove("active");
        visualItems[i]?.classList.remove("active");
        const bar = item.querySelector('[data-tabs="item-progress"]');
        const details = item.querySelector('[data-tabs="item-details"]');
        tl.set(bar, { transformOrigin: "right center" }, 0)
          .to(bar, { scaleX: 0, duration: 0.3 }, 0)
          // .to (not .fromTo) so it eases from its *current* height, avoiding a jump
          .to(details, { height: 0 }, 0);
      });

      // Reveal the incoming item, easing from wherever it currently sits.
      incomingContent.classList.add("active");
      incomingVisual.classList.add("active");
      tl.to(incomingDetails, { height: "auto" }, 0)
        .set(incomingBar, { scaleX: 0, transformOrigin: "left center" }, 0);
    }

    // on page load, activate the first tab once the user scrolls this section
    // into view. Note: this is scoped to the CURRENT wrapper only — do not
    // re-loop over all wrappers here or you create N² ScrollTriggers.
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      once: true,
      onEnter: () => switchTab(0),
    });

    // switch tabs on hover or click, depending on the wrapper's config
    contentItems.forEach((item, i) => {
      const eventName = openOnHover ? "mouseenter" : "click";
      item.addEventListener(eventName, () => {
        if (item === activeContent) return; // ignore if this one is already active
        switchTab(i);
      });
    });

  });
}

 // [ANIMATED BACKGROUND - CASCADE]
  function initAnimatedBackground() {
    if (typeof gsap === 'undefined') return;

    const container = document.querySelector('[data-el="cascade-bg"]');
    const source = container ? container.querySelector('[data-el="cascade-source"]') : null;
    if (!container || !source) return;
    if (container.dataset.jsInit === 'true') return; // don't double-init
    container.dataset.jsInit = 'true';

    // ---- Configuration ----
    const CONFIG = {
      cycleSeconds: 16,        // time for one copy to cross the full path
      copiesPerTrack: 2,       // copies in flight at once
      scaleStart: 1,           // size at spawn (left)
      scaleEnd: 0.34,          // size as it recedes (right)
      maxOpacity: 1,           // global opacity multiplier
      travelEase: 1.0,         // 1 = linear; >1 decelerates toward the end
      blend: 'screen',         // 'screen' | 'plus-lighter' | 'lighten' | 'normal'
      baseHeightRatio: 1.5,   // copy height at scale 1, relative to container height
      yRatio: 0.5,             // vertical centre of the track (fraction of height)
      driftRatio: 0.04,        // subtle vertical drift across the journey
      xStart: -0.25,           // centre start X (off-screen left)
      xEnd: 0.75,              // centre end X (off-screen right)
      fadeIn: 0.05,            // fraction of path spent fading in
      fadeOut: 0.125,           // fraction after which fade-out begins
      parallax: { x: -20, y: 14, ease: 0.6 } // subtle mouse parallax (max px shift)
    };

    const ASPECT = (source.naturalWidth && source.naturalHeight)
      ? source.naturalWidth / source.naturalHeight
      : 849 / 905; // matches the supplied asset

    // ---- math helpers ----
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const smooth = (x) => x * x * (3 - 2 * x);                 // smoothstep
    const easeTravel = (p) => 1 - Math.pow(1 - p, CONFIG.travelEase);

    // ---- build the layer + copies ----
    const layer = document.createElement('div');
    layer.setAttribute('data-el', 'cascade-layer');
    container.appendChild(layer);

    const copies = [];
    for (let i = 0; i < CONFIG.copiesPerTrack; i++) {
      const el = source.cloneNode(true);
      el.setAttribute('data-el', 'cascade-copy');
      el.setAttribute('aria-hidden', 'true');
      el.draggable = false;
      el.style.mixBlendMode = CONFIG.blend;
      // Persistent compositor layers: the copies animate transform/opacity on
      // every visible frame, so holding their rasterization is a net win.
      el.style.willChange = 'transform, opacity';
      layer.appendChild(el);
      copies.push({ el: el, offset: i / CONFIG.copiesPerTrack });
    }

    source.style.display = 'none'; // hide the original AFTER cloning

    // ---- layout (recomputed on resize) ----
    let W = 0, H = 0, baseW = 0, baseH = 0;
    function computeLayout() {
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      baseH = H * CONFIG.baseHeightRatio;
      baseW = baseH * ASPECT;
      copies.forEach((c) => {
        c.el.style.width = baseW + 'px';
        c.el.style.height = baseH + 'px';
      });
    }

    function fade(sp) {
      let o;
      if (sp < CONFIG.fadeIn) o = sp / CONFIG.fadeIn;
      else if (sp > CONFIG.fadeOut) o = 1 - (sp - CONFIG.fadeOut) / (1 - CONFIG.fadeOut);
      else o = 1;
      return smooth(clamp01(o));
    }

    function render(copy, p) {
      const sp = easeTravel(p);
      const cx = lerp(CONFIG.xStart * W, CONFIG.xEnd * W, sp);
      const cy = CONFIG.yRatio * H + CONFIG.driftRatio * H * sp;
      const s = lerp(CONFIG.scaleStart, CONFIG.scaleEnd, sp);
      const op = fade(sp) * CONFIG.maxOpacity;
      copy.el.style.transform =
        'translate3d(' + (cx - baseW / 2) + 'px,' + (cy - baseH / 2) + 'px,0) scale(' + s + ')';
      copy.el.style.opacity = op;
      copy.sp = sp; // stashed for applyZOrder() — no z-index write here
    }

    // Bigger copies (earlier in the path, smaller sp) render in front. Because
    // the copies shrink continuously, their relative order only changes when one
    // wraps back to the start — so writing z-index by rank, and only when the
    // rank changes, replaces the old per-frame style.zIndex write (a style
    // recalc every frame) with roughly one write per wrap.
    function applyZOrder() {
      copies
        .slice()
        .sort((a, b) => b.sp - a.sp) // back → front
        .forEach((c, i) => {
          if (c.z !== i) {
            c.z = i;
            c.el.style.zIndex = i;
          }
        });
    }

    // ---- clock (one shared GSAP ticker) ----
    let elapsed = 0;
    let running = false;
    let offscreen = false;
    let hidden = false;
    const speed = 1 / CONFIG.cycleSeconds;

    function tick(time, deltaMs) {
      if (offscreen || hidden) return; // skip work when not visible
      elapsed += deltaMs / 1000;
      copies.forEach((c) => render(c, (c.offset + elapsed * speed) % 1));
      applyZOrder();
    }
    function start() { if (!running) { running = true; gsap.ticker.add(tick); } }
    function renderStatic() { copies.forEach((c) => render(c, c.offset)); applyZOrder(); }

    computeLayout();

    // resize
    if ('ResizeObserver' in window) {
      new ResizeObserver(computeLayout).observe(container);
    } else {
      window.addEventListener('resize', computeLayout);
    }

    // pause off-screen + when the tab is hidden (battery friendly)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        offscreen = !entries[0].isIntersecting;
      }, { threshold: 0 }).observe(container);
    }
    document.addEventListener('visibilitychange', () => { hidden = document.hidden; });

    // ---- subtle mouse parallax (pointer devices only) ----
    const canHover = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (canHover && !reduce) {
      const xTo = gsap.quickTo(layer, 'x', { duration: CONFIG.parallax.ease, ease: 'power3' });
      const yTo = gsap.quickTo(layer, 'y', { duration: CONFIG.parallax.ease, ease: 'power3' });
      window.addEventListener('pointermove', (e) => {
        const px = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 .. 1
        const py = (e.clientY / window.innerHeight - 0.5) * 2;
        xTo(px * CONFIG.parallax.x);
        yTo(py * CONFIG.parallax.y);
      }, { passive: true });
    }

    if (reduce) renderStatic(); // respect reduced motion: a calm static frame
    else start();
  }

function initToggleSwitches() {
  const cleanups = [];

  document.querySelectorAll("[data-toggle-init]").forEach((toggle) => {
    const buttons = [...toggle.querySelectorAll("[data-toggle-btn]")];
    if (buttons.length < 2) return;

    toggle.style.setProperty("--toggle-count", buttons.length);

    // Initial active is the marked button, otherwise the first.
    let activeIndex = buttons.findIndex((btn) => btn.hasAttribute("data-toggle-active"));
    if (activeIndex < 0) activeIndex = 0;

    // --- Optional hero-slide wiring ------------------------------------------
    // If this toggle lives in a [data-hero-visual] that also holds a
    // [data-hero-slides-wrap] with a matching number of [data-hero-slide]
    // children, drive those slides from the toggle. If not, the toggle behaves
    // exactly as before (buttons only) — this whole block simply stays dormant.
    const scope = toggle.closest("[data-hero-visual]") || toggle.parentElement;
    const slidesWrap = scope && scope.querySelector("[data-hero-slides-wrap]");
    const slides = slidesWrap ? [...slidesWrap.querySelectorAll("[data-hero-slide]")] : [];
    const hasSlides =
      typeof gsap !== "undefined" && slides.length === buttons.length && slides.length > 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Autoplay is opt-in via data attributes on [data-toggle-init], mirroring
    // initTabSystem. e.g. data-toggle-autoplay="true" data-toggle-autoplay-duration="5000"
    const autoplay = toggle.dataset.toggleAutoplay === "true";
    const autoplayDuration = parseInt(toggle.dataset.toggleAutoplayDuration, 10) || 5000;

    // Diagonal wipe clip-paths. The moving edge is the "/" line from (p%, 0) at the
    // top to (p-100%, 100%) at the bottom — a constant-slope diagonal that sweeps
    // left→right as p runs 0→200. ENTER reveals the region LEFT of that edge (it
    // grows to fill the box); EXIT hides that same left region (so the slide shows
    // only what's RIGHT of the edge, shrinking to nothing). Because both use the
    // exact same edge at the same progress, the incoming reveal and the outgoing
    // hide track each other pixel-for-pixel — it reads as one seamless wipe.
    //
    // ENTER_TO and EXIT_FROM are both the full box visually (just different vertex
    // orderings), so snapping between them on a resting slide is invisible.
    const CLIP_ENTER_FROM = "polygon(0% 0%, 0% 0%, -100% 100%, 0% 100%)";     // revealed: nothing
    const CLIP_ENTER_TO   = "polygon(0% 0%, 200% 0%, 100% 100%, 0% 100%)";    // revealed: full box
    const CLIP_EXIT_FROM  = "polygon(0% 0%, 100% 0%, 100% 100%, -100% 100%)"; // showing: full box
    const CLIP_EXIT_TO    = "polygon(200% 0%, 100% 0%, 100% 100%, 100% 100%)"; // showing: nothing

    let currentSlide = hasSlides ? slides[activeIndex] : null;
    let autoplayTimer = null;
    const slideTweens = new Map(); // slide -> its currently-running timeline
    const exiting = new Set();     // slides mid-exit (so we don't restart their wipe)

    function scheduleAutoplay() {
      clearTimeout(autoplayTimer);
      if (!autoplay || reduceMotion || buttons.length < 2) return;
      autoplayTimer = setTimeout(() => {
        setActive((activeIndex + 1) % buttons.length);
      }, autoplayDuration);
    }

    // Each slide owns exactly one timeline. Before handing it a new one we kill the
    // old — but we never touch any OTHER slide's timeline, so interrupting one
    // transition can't orphan a slide that's still animating (the old stuck bug).
    function killSlide(slide) {
      const tl = slideTweens.get(slide);
      if (tl) tl.kill();
      gsap.killTweensOf(slide);
    }

    function playEnter(slide) {
      killSlide(slide);
      exiting.delete(slide);
      const tl = gsap.timeline();
      tl.set(slide, { zIndex: 2, autoAlpha: 1 }) // visible instantly — reveal is clip + slide, not a fade
        .fromTo(slide.querySelector("img"), { xPercent: 25 }, { xPercent: 0, duration: 1.5, ease: "expo.out" }, 0)
        .fromTo(slide, { clipPath: CLIP_ENTER_FROM }, { clipPath: CLIP_ENTER_TO, duration: 1, ease: "power2.out" }, 0);
      slideTweens.set(slide, tl);
    }

    function playExit(slide) {
      killSlide(slide);
      exiting.add(slide);
      // NOTE: the exit clip animation is NOT redundant with the enter wipe — the
      // slide graphics have transparent backgrounds, so without it the outgoing
      // slide would show through the incoming slide's transparent regions.
      // The slide hides ITSELF on completion, so even one interrupted mid-enter by
      // rapid clicks is always driven fully out — it can never get stuck visible.
      const tl = gsap.timeline({
        onComplete: () => {
          exiting.delete(slide);
          gsap.set(slide, { autoAlpha: 0 });
        },
      });
      tl.set(slide, { zIndex: 1 })
        .fromTo(slide, { clipPath: CLIP_EXIT_FROM }, { clipPath: CLIP_EXIT_TO, duration: 1, ease: "power2.out" }, 0)
        .to(slide.querySelector("img"), { xPercent: -25, duration: 1.5, ease: "expo.out" }, 0);
      slideTweens.set(slide, tl);
    }

    // One-time slide setup: park every non-active slide in its fully-hidden pose so
    // the CSS `visibility:hidden` is owned by GSAP from here on.
    function initSlides() {
      slides.forEach((slide, i) => {
        const isActive = i === activeIndex;
        slide.toggleAttribute("data-hero-slide-active", isActive);
        gsap.set(slide, {
          xPercent: 0,
          clipPath: isActive ? CLIP_ENTER_TO : CLIP_EXIT_TO,
          autoAlpha: isActive ? 1 : 0, // autoAlpha drives visibility + opacity (no fade wanted)
          zIndex: isActive ? 2 : 1,
        });
      });
      currentSlide = slides[activeIndex];
    }

    function switchSlide(index) {
      const incoming = slides[index];
      if (incoming === currentSlide) return;

      slides.forEach((slide, i) =>
        slide.toggleAttribute("data-hero-slide-active", i === index)
      );

      // Reduced motion: swap instantly, no animation.
      if (reduceMotion) {
        slides.forEach((slide, i) =>
          gsap.set(slide, {
            xPercent: 0,
            clipPath: i === index ? CLIP_ENTER_TO : CLIP_EXIT_TO,
            autoAlpha: i === index ? 1 : 0,
            zIndex: i === index ? 2 : 1,
          })
        );
        exiting.clear();
        currentSlide = incoming;
        return;
      }

      // Exit any visible slide that isn't the target. Skip ones already exiting so
      // their wipe finishes cleanly instead of snapping back to full and re-wiping.
      slides.forEach((slide) => {
        if (slide === incoming || exiting.has(slide)) return;
        if (gsap.getProperty(slide, "opacity") > 0) playExit(slide);
      });
      playEnter(incoming);
      currentSlide = incoming;
    }

    function setActive(index) {
      activeIndex = index;
      toggle.style.setProperty("--toggle-active", index);
      buttons.forEach((btn, i) => {
        const isActive = i === index;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        btn.toggleAttribute("data-toggle-active", isActive);
        btn.tabIndex = isActive ? 0 : -1;
      });
      if (hasSlides) switchSlide(index);
      scheduleAutoplay();
    }

    function onClick(event) {
      const index = buttons.indexOf(event.currentTarget);
      if (index !== activeIndex) setActive(index);
    }

    function onKeydown(event) {
      const dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!dir) return;
      event.preventDefault();
      const next = (activeIndex + dir + buttons.length) % buttons.length;
      setActive(next);
      buttons[next].focus();
    }

    buttons.forEach((btn) => {
      btn.addEventListener("click", onClick);
      btn.addEventListener("keydown", onKeydown);
    });

    // Pause autoplay while the pointer is over the visual, resume on leave.
    const pauseHost = hasSlides ? scope : null;
    const onEnter = () => clearTimeout(autoplayTimer);
    const onLeave = () => scheduleAutoplay();
    if (pauseHost && autoplay) {
      pauseHost.addEventListener("pointerenter", onEnter);
      pauseHost.addEventListener("pointerleave", onLeave);
    }

    if (hasSlides) initSlides(); // set slide poses before the first activation
    setActive(activeIndex);

    cleanups.push(() => {
      clearTimeout(autoplayTimer);
      slideTweens.forEach((tl) => tl.kill());
      buttons.forEach((btn) => {
        btn.removeEventListener("click", onClick);
        btn.removeEventListener("keydown", onKeydown);
      });
      if (pauseHost && autoplay) {
        pauseHost.removeEventListener("pointerenter", onEnter);
        pauseHost.removeEventListener("pointerleave", onLeave);
      }
    });
  });

  // Return a destroy function
  return () => cleanups.forEach((fn) => fn());
}

function initSmooothy() {
  const section = document.querySelector("[data-slider-section]");
  const sliderEl = document.querySelector("[data-slider]");
  if (!sliderEl) return;

  class AutoScrollSlider extends Core {
    #isPaused = false;
    #scrollSpeed = 100; // slides per second (adjust for faster/slower)
    #wasDragging = false;
    #resumeTimer = null;
    #tick = null;
    #parallaxStrength = -20; // max translateX (%) as a slide crosses the viewport
    #parallaxElements = [];
    #prefersReducedMotion = false;
    #onWheel = null;

    constructor(wrapper, config = {}) {
      super(wrapper, {
        ...config,
        infinite: true,
        snap: false, // free continuous scrolling
        variableWidth: true,
        dragSensitivity: 0.25
      });

      // Store a single bound reference so we can add AND remove the same fn
      this.#tick = this.update.bind(this);
      gsap.ticker.add(this.#tick);

      this.#setupParallax();
      this.#setupPauseOnInteraction();
      this.#preventHistoryNavigation();
    }

    // smooothy's own wheel listener is passive, so it can't stop the browser
    // from treating a horizontal trackpad swipe as back/forward navigation.
    // Add a non-passive listener that cancels the gesture when it's horizontal-
    // dominant (which the slider consumes anyway); vertical scroll passes through.
    #preventHistoryNavigation() {
      this.#onWheel = (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault();
        }
      };
      this.wrapper.addEventListener("wheel", this.#onWheel, { passive: false });
    }

    // Library-provided per-frame hook (runs inside Core's update)
    onUpdate = () => {
      if (!this.#isPaused && this.isVisible && !this.isDragging) {
        // Drive continuous motion via target (index space); Core lerps current toward it
        this.target -= this.#scrollSpeed * this.deltaTime;
      }
      this.#checkDragging();
      this.#applyParallax();
    };

    // Pair each [data-p] element with its owning slide so we can measure the
    // slide's position (which smooothy transforms) rather than the element's own
    // (which we transform) — reading the latter would create a feedback loop.
    #setupParallax() {
      this.#prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      this.#parallaxElements = [...this.wrapper.querySelectorAll("[data-p]")].map(
        (el) => ({
          el,
          slide: this.items.find((item) => item.contains(el)) || el.parentElement,
          // Optional per-element multiplier, e.g. data-p="0.5" for a subtler layer
          factor: parseFloat(el.dataset.p) || 1,
        })
      );
    }

    // Runs every frame after smooothy has repositioned the slides. Normalize each
    // slide's centre against the viewport centre (~[-1,1] as it crosses) so the
    // effect is independent of variableWidth pixel units.
    #applyParallax() {
      if (this.#prefersReducedMotion || !this.#parallaxElements.length) return;

      const wrapperRect = this.wrapper.getBoundingClientRect();
      const center = wrapperRect.left + wrapperRect.width / 2;

      this.#parallaxElements.forEach(({ el, slide, factor }) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const normalized = (slideCenter - center) / wrapperRect.width;
        const offset = normalized * this.#parallaxStrength * factor;
        el.style.transform = `translateX(${offset}%)`;
      });
    }

    #checkDragging() {
      if (this.isDragging && !this.#wasDragging) {
        // Started dragging
        this.#isPaused = true;
        this.#wasDragging = true;
      } else if (!this.isDragging && this.#wasDragging) {
        // Stopped dragging - resume after delay
        this.#wasDragging = false;
        this.#scheduleResume();
      }
    }

    #scheduleResume() {
      clearTimeout(this.#resumeTimer);
      this.#resumeTimer = setTimeout(() => {
        this.#isPaused = false;
      }, 2000);
    }

    #setupPauseOnInteraction() {
      const el = this.wrapper;

      // Pause on hover
      el.addEventListener("mouseenter", () => {
        this.#isPaused = true;
      });
      el.addEventListener("mouseleave", () => {
        this.#isPaused = false;
      });

      // Pause on touch, resume after delay
      el.addEventListener(
        "touchstart",
        () => {
          this.#isPaused = true;
        },
        { passive: true }
      );
      el.addEventListener("touchend", () => this.#scheduleResume());
    }

    destroy() {
      clearTimeout(this.#resumeTimer);
      if (this.#tick) gsap.ticker.remove(this.#tick);
      if (this.#onWheel) this.wrapper.removeEventListener("wheel", this.#onWheel);
      this.#parallaxElements.forEach(({ el }) => {
        el.style.transform = "";
      });
      super.destroy?.();
    }
  }

  // Pass the actual [data-slider] element directly
  new AutoScrollSlider(sliderEl, {
    infinite: true,
    snap: false,
    variableWidth: true,
  });
}

function initCopyEmailClipboard() {
  const buttons = document.querySelectorAll('[data-copy-button]');
  if (!buttons.length) return;

  const copyEmail = (button) => {
  	// Email to copy to clipboard is taking from the button itself, or if that's empty,
    // from a text element inside the button
    const email =
      button.getAttribute('data-copy-email') ||
      button.querySelector('[data-copy-email-element]').textContent.trim();
    if (email) {
      navigator.clipboard.writeText(email).then(() => {
        button.setAttribute('data-copy-button', 'copied');
        button.setAttribute('aria-label', 'Email copied to clipboard!');
      });
    }
  };

  const handleInteraction = (e) => {
    if (
      e.type === 'click' ||
      (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))
    ) {
      e.preventDefault();
      copyEmail(e.currentTarget);
    }
  };

  buttons.forEach((button) => {
    button.addEventListener('click', handleInteraction);
    button.addEventListener('keydown', handleInteraction);
    button.addEventListener('mouseleave', () => {
    	// Remove 'active' attribute to reset color and text transform
      button.removeAttribute('data-copy-button');
      // Remove focus on mouseleave to clear keyboard focus styling
      button.blur();
      button.setAttribute('aria-label', 'Copy email to clipboard');
    });
    button.addEventListener('blur', () => {
      button.removeAttribute('data-copy-button');
      button.setAttribute('aria-label', 'Copy email to clipboard');
    });
  });
}

function initModalBasic() {

  const modalGroup = document.querySelector('[data-modal-group-status]');
  const modals = document.querySelectorAll('[data-modal-name]');
  const modalTargets = document.querySelectorAll('[data-modal-target]');

  // Elements that can receive keyboard focus inside an open modal
  const FOCUSABLE_SELECTOR =
    'a[href], area[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), iframe, audio[controls], ' +
    'video[controls], [contenteditable]:not([contenteditable="false"]), ' +
    '[tabindex]:not([tabindex="-1"])';

  const isNativeControl = (el) => {
    const tag = el.tagName.toLowerCase();
    return tag === 'button' || (tag === 'a' && el.hasAttribute('href'));
  };

  const getFocusable = (container) =>
    Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === container
    );

  // Track open state so focus can be restored to the trigger on close
  let activeModal = null;
  let lastTrigger = null;

  // --- Scroll lock (Lenis is currently disabled, so a plain overflow lock is
  // enough; compensate for the scrollbar width to avoid a layout shift) ---
  let scrollLocked = false;
  const lockScroll = () => {
    if (scrollLocked) return;
    scrollLocked = true;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  };
  const unlockScroll = () => {
    if (!scrollLocked) return;
    scrollLocked = false;
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  // --- One-time ARIA wiring ---
  const nameToId = new Map();

  modals.forEach((modal, i) => {
    const name = modal.getAttribute('data-modal-name');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    // Programmatic focus target when the modal has no focusable children
    if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    // Accessible name from the data-modal-name value (don't clobber existing)
    if (name && !modal.hasAttribute('aria-label') && !modal.hasAttribute('aria-labelledby')) {
      modal.setAttribute('aria-label', name);
    }
    // Ensure a unique id so triggers can point aria-controls at it
    if (!modal.id) {
      const base = 'modal-' + (name ? name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-') : i);
      let id = base;
      let n = 1;
      while (document.getElementById(id)) id = `${base}-${n++}`;
      modal.id = id;
    }
    if (name) nameToId.set(name, modal.id);
  });

  modalTargets.forEach((trigger) => {
    const name = trigger.getAttribute('data-modal-target');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    const id = nameToId.get(name);
    if (id) trigger.setAttribute('aria-controls', id);
    // Make non-native triggers behave like buttons for AT + keyboard
    if (!isNativeControl(trigger)) {
      if (!trigger.hasAttribute('role')) trigger.setAttribute('role', 'button');
      if (!trigger.hasAttribute('tabindex')) trigger.setAttribute('tabindex', '0');
    }
  });

  // --- Open / close ---
  function openModal(name, trigger) {
    const modal = document.querySelector(`[data-modal-name="${name}"]`);
    if (!modal) return;

    // Reset everything first
    modalTargets.forEach((target) => {
      target.setAttribute('data-modal-status', 'not-active');
      target.setAttribute('aria-expanded', 'false');
    });
    modals.forEach((m) => m.setAttribute('data-modal-status', 'not-active'));

    // Activate the matching trigger(s) + modal
    document.querySelectorAll(`[data-modal-target="${name}"]`).forEach((t) => {
      t.setAttribute('data-modal-status', 'active');
      t.setAttribute('aria-expanded', 'true');
    });
    modal.setAttribute('data-modal-status', 'active');

    if (modalGroup) modalGroup.setAttribute('data-modal-group-status', 'active');

    lockScroll();
    activeModal = modal;
    lastTrigger = trigger || document.querySelector(`[data-modal-target="${name}"]`);

    // Move focus into the modal
    const focusable = getFocusable(modal);
    (focusable[0] || modal).focus();
  }

  function closeAllModals() {
    if (!activeModal) return;

    modalTargets.forEach((target) => {
      target.setAttribute('data-modal-status', 'not-active');
      target.setAttribute('aria-expanded', 'false');
    });
    modals.forEach((m) => m.setAttribute('data-modal-status', 'not-active'));
    if (modalGroup) modalGroup.setAttribute('data-modal-group-status', 'not-active');

    unlockScroll();

    const returnTo = lastTrigger;
    activeModal = null;
    lastTrigger = null;

    // Restore focus to the element that opened the modal
    if (returnTo && typeof returnTo.focus === 'function') returnTo.focus();
  }

  // Open modal (click + keyboard for non-native triggers)
  modalTargets.forEach((trigger) => {
    const name = trigger.getAttribute('data-modal-target');
    trigger.addEventListener('click', () => openModal(name, trigger));
    trigger.addEventListener('keydown', (event) => {
      if (isNativeControl(trigger)) return; // native buttons/links handle this
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        openModal(name, trigger);
      }
    });
  });

  // Close buttons (click + keyboard + accessible name for icon-only buttons)
  document.querySelectorAll('[data-modal-close]').forEach((closeBtn) => {
    if (!isNativeControl(closeBtn)) {
      if (!closeBtn.hasAttribute('role')) closeBtn.setAttribute('role', 'button');
      if (!closeBtn.hasAttribute('tabindex')) closeBtn.setAttribute('tabindex', '0');
    }
    if (!closeBtn.getAttribute('aria-label') && !closeBtn.textContent.trim()) {
      closeBtn.setAttribute('aria-label', 'Close modal');
    }
    closeBtn.addEventListener('click', closeAllModals);
    closeBtn.addEventListener('keydown', (event) => {
      if (isNativeControl(closeBtn)) return;
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        closeAllModals();
      }
    });
  });

  // Close when clicking the backdrop (the group wrapper itself, not its contents)
  if (modalGroup) {
    modalGroup.addEventListener('click', (event) => {
      if (activeModal && event.target === modalGroup) closeAllModals();
    });
  }

  // Global key handling: Escape to close + Tab focus trap within the open modal
  document.addEventListener('keydown', (event) => {
    if (!activeModal) return;

    if (event.key === 'Escape') {
      closeAllModals();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusable(activeModal);
    if (!focusable.length) {
      event.preventDefault();
      activeModal.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = document.activeElement;

    if (event.shiftKey && (current === first || current === activeModal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

 function init() {
  // visual, font-independent — run immediately
  initButton046();
  initMegaNavDirectionalHover();
  initMediaSetup();
  initNumberOdometer();
  initMouseMove();
  initMarqueeScrollDirection();
  // initLenis();
  initCobe();
  initHomeCobe();
  initSwipers();
  initGlobalParallax();
  initTabSystem();
  initAnimatedBackground();
  initToggleSwitches();
  initCopyEmailClipboard();
  initModalBasic();





 document.fonts.ready.then(() => {    initFOUC();
    initScrollAnimations();  // non-split scroll fades
    initSmooothy();
    initLoadAnimations();
    initTextSplit();})

  // document.fonts
  //   .load('1em Labgrotesque')
  //   .then(startTextAnimations)
  //   .catch(startTextAnimations);
}

if (document.readyState === 'loading')
  {
    addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
  

