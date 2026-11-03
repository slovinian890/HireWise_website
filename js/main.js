(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Reveal runs first so content never stays hidden if a later feature fails.
    const revealItems = document.querySelectorAll("[data-reveal]");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });

        revealItems.forEach((item) => revealObserver.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("is-visible"));
    }

    const header = document.querySelector("[data-header]");
    const nav = document.getElementById("site-nav");
    const toggle = document.querySelector(".nav-toggle");

    const setHeaderState = () => {
        header?.classList.toggle("is-scrolled", window.scrollY > 16);
    };

    setHeaderState();
    window.addEventListener("scroll", setHeaderState, { passive: true });

    const setMenu = (isOpen) => {
        document.documentElement.classList.toggle("menu-open", isOpen);
        header?.classList.toggle("menu-open", isOpen);
        nav?.classList.toggle("is-open", isOpen);
        toggle?.setAttribute("aria-expanded", String(isOpen));
        toggle?.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    };

    toggle?.addEventListener("click", () => setMenu(!nav?.classList.contains("is-open")));

    nav?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !nav?.classList.contains("is-open")) return;
        setMenu(false);
        toggle?.focus();
    });

    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
    });

    const handleTabKeys = (tabs, select, orientation = "horizontal") => (event) => {
        const [prevKey, nextKey] = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
        const current = tabs.indexOf(document.activeElement);
        if (current === -1) return;

        const targets = {
            [prevKey]: (current - 1 + tabs.length) % tabs.length,
            [nextKey]: (current + 1) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
        };
        const next = targets[event.key];
        if (next === undefined) return;

        event.preventDefault();
        select(next);
        tabs[next].focus();
    };

    const setSelectedTab = (tabs, index) => {
        tabs.forEach((tab, i) => {
            const isActive = i === index;
            tab.setAttribute("aria-selected", String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
        });
    };

    const how = document.querySelector("[data-how]");

    if (how) {
        const sideTabs = [...how.querySelectorAll("[data-side-tab]")];
        const panels = [...how.querySelectorAll("[data-how-panel]")];

        const selectStep = (panel, index) => {
            const steps = [...panel.querySelectorAll("[data-step]")];
            setSelectedTab(steps, index);
            steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
            panel.querySelectorAll("[data-step-screen]").forEach((screen, i) => {
                screen.classList.toggle("is-active", i === index);
            });
        };

        const selectSide = (index) => {
            setSelectedTab(sideTabs, index);
            panels.forEach((panel, i) => {
                panel.hidden = i !== index;
            });
            selectStep(panels[index], 0);
        };

        sideTabs.forEach((tab, index) => {
            tab.addEventListener("click", () => selectSide(index));
        });
        sideTabs[0]?.parentElement.addEventListener("keydown", handleTabKeys(sideTabs, selectSide));

        panels.forEach((panel) => {
            const steps = [...panel.querySelectorAll("[data-step]")];
            const choose = (index) => {
                how.classList.remove("is-autoplay");
                selectStep(panel, index);
            };

            steps.forEach((step, index) => {
                step.addEventListener("click", () => choose(index));
                step.addEventListener("animationend", (event) => {
                    if (event.animationName !== "step-fill") return;
                    selectStep(panel, (index + 1) % steps.length);
                });
            });
            panel.querySelector("[role=tablist]")?.addEventListener("keydown", handleTabKeys(steps, choose, "vertical"));
        });

        if (!reduceMotion.matches && "IntersectionObserver" in window) {
            how.classList.add("is-autoplay");
            new IntersectionObserver(([entry]) => {
                how.classList.toggle("is-inview", entry.isIntersecting);
            }, { threshold: 0.35 }).observe(how);
        }
    }

    const tour = document.querySelector("[data-tour]");

    if (tour) {
        const track = tour.querySelector("[data-tour-track]");
        const items = [...track.querySelectorAll(".tour-item")];
        const tabs = [...tour.querySelectorAll("[data-tour-tab]")];
        const prev = tour.querySelector("[data-tour-prev]");
        const next = tour.querySelector("[data-tour-next]");

        const updateControls = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            prev.disabled = track.scrollLeft <= 2;
            next.disabled = track.scrollLeft >= maxScroll - 2;
        };

        const selectGroup = (index) => {
            const group = tabs[index].dataset.tourTab;
            let order = 0;

            setSelectedTab(tabs, index);
            items.forEach((item) => {
                const isMatch = item.dataset.group === group;
                item.hidden = !isMatch;
                if (isMatch) item.style.setProperty("--i", order++);
            });
            track.scrollLeft = 0;
            updateControls();
        };

        const scrollPage = (direction) => {
            const firstItem = items.find((item) => !item.hidden);
            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            const itemWidth = (firstItem?.offsetWidth ?? 250) + gap;
            const perPage = Math.max(1, Math.floor(track.clientWidth / itemWidth) - 1);
            track.scrollBy({ left: direction * itemWidth * perPage, behavior: reduceMotion.matches ? "auto" : "smooth" });
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener("click", () => selectGroup(index));
        });
        tabs[0]?.parentElement.addEventListener("keydown", handleTabKeys(tabs, selectGroup));

        prev.addEventListener("click", () => scrollPage(-1));
        next.addEventListener("click", () => scrollPage(1));
        track.addEventListener("scroll", updateControls, { passive: true });
        window.addEventListener("resize", updateControls);

        selectGroup(0);
    }

    const proMode = document.querySelector("[data-pro-mode]");
    const proSwitch = proMode?.querySelector("[data-pro-switch]");
    const proStatus = proMode?.querySelector("[data-pro-status]");

    proSwitch?.addEventListener("click", () => {
        const isOn = proSwitch.getAttribute("aria-checked") !== "true";
        proSwitch.setAttribute("aria-checked", String(isOn));
        proMode.classList.toggle("is-on", isOn);
        if (proStatus) {
            proStatus.textContent = isOn ? "You’re live — 4 new jobs near you" : "Toggle to start receiving client jobs";
        }
    });

    const notify = document.querySelector("[data-notify]");
    const notifications = [
        ["New offer received", "Bathroom Plumbing Repair · $320"],
        ["Offer accepted", "Install 6 Ceiling Lights · $750"],
        ["Job starting soon", "Tomorrow at 2 PM with Dave"],
        ["Payment released", "$750 for Install 6 Ceiling Lights"],
    ];

    if (notify && !reduceMotion.matches) {
        const title = notify.querySelector("b");
        const text = notify.querySelector("small");
        let current = 0;

        window.setInterval(() => {
            if (document.hidden) return;
            notify.classList.add("is-swapping");
            window.setTimeout(() => {
                current = (current + 1) % notifications.length;
                [title.textContent, text.textContent] = notifications[current];
                notify.classList.remove("is-swapping");
            }, 280);
        }, 4200);
    }
})();
