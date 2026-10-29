(function () {
  if (document.documentElement.classList.contains("is-handheld")) return;

  var boot = document.getElementById("boot");
  if (boot && !document.documentElement.classList.contains("no-boot")) {
    document.body.classList.add("is-booting");
    var started = Date.now();
    var bootDone = false;
    var finishBoot = function () {
      if (bootDone) return;
      bootDone = true;
      boot.classList.add("is-done");
      document.body.classList.remove("is-booting");
      window.setTimeout(function () {
        if (boot.parentNode) boot.parentNode.removeChild(boot);
      }, 720);
    };
    var hold = function () {
      var wait = Math.max(0, 780 - (Date.now() - started));
      window.setTimeout(finishBoot, wait);
    };
    if (document.readyState === "complete") hold();
    else window.addEventListener("load", hold);
    window.setTimeout(finishBoot, 2200);
  } else if (boot && boot.parentNode) {
    boot.parentNode.removeChild(boot);
  }

  var header = document.querySelector(".header");
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".site-menu");
  var panel = document.querySelector(".staggered-menu-panel");
  var filterButtons = document.querySelectorAll("[data-group]");
  var cards = document.querySelectorAll(".car");
  var forms = document.querySelectorAll(".book-form");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ticking = false;
  function onScroll() {
    if (!header || ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    });
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var menuOpen = false;
  var textInner = toggle ? toggle.querySelector(".sm-toggle-textInner") : null;
  var icon = toggle ? toggle.querySelector(".sm-icon") : null;

  function shiftMenu(open, animate) {
    if (!menu || !panel) return;
    var layers = menu.querySelectorAll(".sm-prelayer");
    var labels = panel.querySelectorAll(".sm-panel-itemLabel");
    var socials = panel.querySelectorAll(".sm-socials-title, .sm-socials-link");
    var useMotion = animate && !reduceMotion && window.gsap;
    menu.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if ("inert" in panel) panel.inert = !open;
    if (!useMotion) {
      var hidden = open ? "translateX(0)" : "translateX(100%)";
      layers.forEach(function (layer) { layer.style.transform = hidden; });
      panel.style.transform = hidden;
      labels.forEach(function (label) { label.style.transform = "none"; });
      if (textInner) textInner.style.transform = open ? "translateY(-50%)" : "none";
      if (icon) icon.style.transform = open ? "rotate(225deg)" : "none";
      return;
    }
    var off = 100;
    window.gsap.killTweensOf([panel, textInner, icon].concat([].slice.call(layers), [].slice.call(labels), [].slice.call(socials)));
    if (open) {
      window.gsap.set(labels, { yPercent: 120, rotate: 8 });
      window.gsap.set(socials, { y: 16, opacity: 0 });
      var tl = window.gsap.timeline();
      tl.to(layers, { x: 0, xPercent: 0, duration: 0.5, ease: "power4.out", stagger: 0.07 }, 0);
      tl.fromTo(panel, { x: 0, xPercent: off }, { x: 0, xPercent: 0, duration: 0.65, ease: "power4.out" }, 0.12);
      tl.to(labels, { yPercent: 0, rotate: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 }, 0.28);
      tl.to(socials, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" }, 0.42);
      if (textInner) tl.to(textInner, { yPercent: -50, duration: 0.45, ease: "power4.out" }, 0);
      if (icon) tl.to(icon, { rotate: 225, duration: 0.7, ease: "power4.out" }, 0);
    } else {
      window.gsap.to(layers, { x: 0, xPercent: off, duration: 0.32, ease: "power3.in", stagger: 0.03 });
      window.gsap.to(panel, { x: 0, xPercent: off, duration: 0.32, ease: "power3.in" });
      if (textInner) window.gsap.to(textInner, { yPercent: 0, duration: 0.3, ease: "power3.inOut" });
      if (icon) window.gsap.to(icon, { rotate: 0, duration: 0.3, ease: "power3.inOut" });
    }
  }

  function closeNav(restoreFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
    shiftMenu(false, true);
    if (restoreFocus && toggle) toggle.focus();
  }

  if (toggle && menu) {
    if (window.gsap && !reduceMotion) {
      window.gsap.set([panel].concat([].slice.call(menu.querySelectorAll(".sm-prelayer"))), { x: 0, xPercent: 100 });
    }
    toggle.addEventListener("click", function () {
      menuOpen = !menuOpen;
      toggle.setAttribute("aria-expanded", menuOpen ? "true" : "false");
      document.body.classList.toggle("nav-open", menuOpen);
      shiftMenu(menuOpen, true);
    });
    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav(true);
    });
    document.addEventListener("mousedown", function (event) {
      if (!menuOpen) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      closeNav(false);
    });
  }

  var priceMin = document.querySelector("#price-filter [name='min']");
  var priceMax = document.querySelector("#price-filter [name='max']");
  var syncGarage = function () {};

  function readMoney(field) {
    if (!field || String(field.value).trim() === "") return null;
    var value = Number(field.value);
    return Number.isFinite(value) ? value : null;
  }

  function applyFilters() {
    var min = readMoney(priceMin);
    var max = readMoney(priceMax);
    var impossible = min !== null && max !== null && min > max;
    var shown = 0;
    cards.forEach(function (card) {
      var price = Number(card.getAttribute("data-price"));
      var show = !impossible && (min === null || price >= min) && (max === null || price <= max);
      card.hidden = !show;
      if (show) shown += 1;
    });
    var status = document.getElementById("filter-status");
    if (status) {
      if (impossible) status.textContent = "Минимум больше максимума.";
      else if (!shown && (min !== null || max !== null)) status.textContent = "В этот бюджет машин нет. Подвиньте сумму.";
      else status.textContent = "";
    }
    syncGarage();
  }

  [priceMin, priceMax].forEach(function (field) {
    if (!field) return;
    field.addEventListener("input", applyFilters);
  });
  var priceForm = document.getElementById("price-filter");
  if (priceForm) {
    priceForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
    });
  }

  document.querySelectorAll("[data-car]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-car");
      forms.forEach(function (form) {
        var select = form.querySelector("[name='car']");
        if (!select) return;
        var hasOption = Array.prototype.some.call(select.options, function (option) {
          return option.value === value;
        });
        if (hasOption) select.value = value;
      });
      cards.forEach(function (card) {
        card.classList.toggle("is-picked", card.contains(button));
      });
      var book = document.getElementById("book");
      if (book && button.tagName !== "A") {
        book.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var trigger = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    if (!trigger || !panel) return;
    panel.setAttribute("aria-hidden", "true");
    trigger.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      panel.setAttribute("aria-hidden", open ? "false" : "true");
    });
  });

  var revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealNodes.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealNodes.forEach(function (node) {
      observer.observe(node);
    });
  } else {
    revealNodes.forEach(function (node) {
      node.classList.add("is-in");
    });
  }

  document.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("focus", function () {
      document.body.classList.add("input-focus");
    });
    field.addEventListener("blur", function () {
      window.setTimeout(function () {
        var active = document.activeElement;
        if (!active || !active.closest || !active.closest("form")) {
          document.body.classList.remove("input-focus");
        }
      }, 0);
    });
  });

  var today = new Date();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");
  var minDate = today.getFullYear() + "-" + month + "-" + day;

  function syncDates(form) {
    var start = form.querySelector("[name='date']");
    var end = form.querySelector("[name='date_back']");
    if (start) start.min = minDate;
    if (end) end.min = start && start.value ? start.value : minDate;
    if (start && end && start.value && end.value && end.value < start.value) {
      end.value = start.value;
    }
  }

  document.querySelectorAll(".book-form, #finder").forEach(function (form) {
    syncDates(form);
    var start = form.querySelector("[name='date']");
    if (start) {
      start.addEventListener("change", function () {
        syncDates(form);
        setInvalid(start, false);
      });
    }
    var end = form.querySelector("[name='date_back']");
    if (end) {
      end.addEventListener("change", function () {
        setInvalid(end, false);
      });
    }
  });

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function setInvalid(field, invalid) {
    if (!field) return;
    field.setAttribute("aria-invalid", invalid ? "true" : "false");
    var note = field.parentElement ? field.parentElement.querySelector(".field-error") : null;
    if (note) note.hidden = !invalid;
  }

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var phone = String(data.get("phone") || "").trim();
      var date = String(data.get("date") || "");
      var dateBack = String(data.get("date_back") || "");
      var nameField = form.querySelector("[name='name']");
      var phoneField = form.querySelector("[name='phone']");
      var backField = form.querySelector("[name='date_back']");
      var valid = true;

      if (name.length < 2) {
        setInvalid(nameField, true);
        valid = false;
      } else {
        setInvalid(nameField, false);
      }

      if (digits(phone).length < 9) {
        setInvalid(phoneField, true);
        valid = false;
      } else {
        setInvalid(phoneField, false);
      }

      if (date && dateBack && dateBack < date) {
        setInvalid(backField, true);
        valid = false;
      } else {
        setInvalid(backField, false);
      }

      if (!valid) {
        var firstInvalid = form.querySelector("[aria-invalid='true']");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var success = form.querySelector(".form-success");
      if (success) {
        success.hidden = false;
        success.focus();
      }
      form.classList.add("is-sent");
    });
  });

  var finder = document.getElementById("finder");
  if (finder) {
    finder.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(finder);
      var car = String(data.get("car") || "all");
      var date = String(data.get("date") || "");
      var dateBack = String(data.get("date_back") || "");
      var error = finder.querySelector(".finder-error");
      if (date && dateBack && dateBack < date) {
        if (error) error.hidden = false;
        var back = finder.querySelector("[name='date_back']");
        if (back) back.focus();
        return;
      }
      if (error) error.hidden = true;

      if (priceMin) priceMin.value = "";
      if (priceMax) priceMax.value = "";
      filterButtons.forEach(function (item) {
        var on = item.getAttribute("data-value") === "all";
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", on ? "true" : "false");
      });
      applyFilters();

      var book = document.getElementById("request");
      if (book) {
        var select = book.querySelector("[name='car']");
        var bookValue = car === "all" ? "Пока не выбрал — подберите" : car;
        if (select) select.value = bookValue;
        var start = book.querySelector("[name='date']");
        var end = book.querySelector("[name='date_back']");
        if (start && date) start.value = date;
        if (end && dateBack) end.value = dateBack;
        syncDates(book);
      }

      var target = null;
      cards.forEach(function (card) {
        var button = card.querySelector("[data-car]");
        var match = car !== "all" && button && button.getAttribute("data-car") === car;
        card.classList.toggle("is-picked", match);
        if (match) target = card;
      });
      var dest = target || document.getElementById("park");
      if (dest) dest.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  var faqTabs = document.querySelectorAll(".faq-index button");
  var faqPanel = document.querySelector(".faq-panel");
  function showFaq(tab) {
    if (!faqPanel || !tab) return;
    faqTabs.forEach(function (item) {
      var on = item === tab;
      item.classList.toggle("is-on", on);
      item.setAttribute("aria-selected", on ? "true" : "false");
    });
    var num = faqPanel.querySelector(".faq-num");
    var title = faqPanel.querySelector("h3");
    var text = faqPanel.querySelector("p:last-child");
    if (num) num.textContent = tab.getAttribute("data-num");
    if (title) title.textContent = tab.getAttribute("data-title");
    if (text) text.textContent = tab.getAttribute("data-answer");
    faqPanel.setAttribute("aria-labelledby", tab.id);
    faqPanel.classList.remove("is-swap");
  }
  faqTabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        faqPanel.classList.add("is-swap");
        window.setTimeout(function () { showFaq(tab); }, 140);
      } else {
        showFaq(tab);
      }
    });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      var next = event.key === "ArrowDown" ? faqTabs[index + 1] : faqTabs[index - 1];
      if (!next) next = event.key === "ArrowDown" ? faqTabs[0] : faqTabs[faqTabs.length - 1];
      next.focus();
      next.click();
    });
  });

  var garage = document.getElementById("garage");
  var garageSlots = garage ? [].slice.call(garage.querySelectorAll(".garage-slot")) : [];
  var garageScreen = document.getElementById("garage-screen");
  var garageHud = document.getElementById("garage-hud");
  var garageStage = document.getElementById("garage-stage");
  var garagePhotos = document.getElementById("garage-photos");
  var garageTicks = document.getElementById("garage-ticks");
  var garageYear = document.getElementById("garage-year");
  var garagePrice = document.getElementById("garage-price");
  var garageName = document.getElementById("garage-name");
  var garageLine = document.getElementById("garage-line");
  var garageFacts = document.getElementById("garage-facts");
    var garageBook = document.getElementById("garage-book");
    var garageStory = document.getElementById("garage-story");
    var garageNote = document.getElementById("garage-note");
    var garageOutline = document.getElementById("garage-outline");
    var garageSketch = document.getElementById("garage-sketch");
  var garageCars = [
    {
      shot: "shot-230",
      year: "2024",
      price: "250",
      name: "BMW 230 xDrive",
      line: "Короткое купе на каждый день. Четыре места, турбо и полный привод.",
      book: "BMW 230 xDrive, 2024",
      alt: "Чёрный BMW 230 xDrive",
      frames: [
        { src: "assets/bmw-230.jpg", pos: "center 52%" },
        { src: "assets/bmw-230.jpg", pos: "64% 48%" },
        { src: "assets/bmw-230.jpg", pos: "36% 56%" }
      ],
      facts: [["Кузов", "Купе"], ["Места", "4"], ["Мотор", "2.0 Turbo, 252 л.с."], ["Коробка", "Автомат"], ["Привод", "Полный"], ["Топливо", "Бензин"]],
      side: "assets/silhouettes/bmw-230-line.png?v=3",
      story: [
        { part: "body", text: "Короткое купе и низкая посадка. Четыре места: сзади нормально на час-два, не на трассу втроём с сумками." },
        { part: "wheel", text: "Полный привод и автомат. По городу и на мокром не выбираете, какая ось тянет." },
        { part: "lamp", text: "2.0 Turbo, 252 л.с., бензин. На обгон хватает. Бак на подаче полный и таким же его забираем." }
      ]
    },
    {
      shot: "shot-530",
      year: "2021",
      price: "280",
      name: "BMW 530i",
      line: "Седан на каждый день. Пять мест, бензин и задний привод.",
      book: "BMW 530i, 2021",
      alt: "BMW 530i",
      frames: null,
      facts: [["Кузов", "Седан"], ["Места", "5"], ["Мотор", "2.0, 252 л.с."], ["Коробка", "Автомат"], ["Привод", "Задний"], ["Топливо", "Бензин"]],
      side: "assets/silhouettes/bmw-530-line.png",
      story: [
        { part: "body", text: "Три объёма и нормальный задний ряд. Если едете вчетвером с сумками, купе уже тесно — здесь спокойнее." },
        { part: "wheel", text: "Задний привод и автомат. На сухом асфальте нос легче, чем у полноприводных соседей по парку." },
        { part: "lamp", text: "2.0, 252 л.с., бензин. Тот же характер мотора, что у купе 230, только кузов длиннее." }
      ]
    },
    {
      shot: "shot-q5",
      year: "2022",
      price: "290",
      name: "Audi Q5",
      line: "Компактный кроссовер на пятерых. Полный привод, посадка выше седана.",
      book: "Audi Q5, 2022",
      alt: "Audi Q5",
      frames: null,
      facts: [["Кузов", "Кроссовер"], ["Места", "5"], ["Мотор", "2.0"], ["Коробка", "Автомат"], ["Привод", "Полный"], ["Топливо", "Бензин"]],
      side: "assets/silhouettes/audi-q5-line.png",
      story: [
        { part: "body", text: "Выше седана и короче большого X5. Во дворе проще развернуться, бордюр не цепляет так, как на низкой машине." },
        { part: "wheel", text: "Полный привод и автомат. Зимой и на мокром это главный довод, не цифра разгона." },
        { part: "lamp", text: "Бензиновая четвёрка 2.0. Отдача зависит от версии — точную называем до подачи, не на глаз." }
      ]
    },
    {
      shot: "shot-a7",
      year: "2022",
      price: "300",
      name: "Audi A7 S line",
      line: "Лифтбек на пятерых. Багажник больше, чем у купе, комплектация S line.",
      book: "Audi A7 S line, 2022",
      alt: "Белый Audi A7 S line",
      frames: [
        { src: "assets/audi-a7.jpg", pos: "center 68%" },
        { src: "assets/audi-a7.jpg", pos: "62% 72%" },
        { src: "assets/audi-a7.jpg", pos: "40% 66%" }
      ],
      facts: [["Кузов", "Лифтбек"], ["Места", "5"], ["Комплектация", "S line"], ["Год", "2022"]],
      side: "assets/silhouettes/audi-a7-line.png?v=3",
      story: [
        { part: "body", text: "Лифтбек: крышка открывается вместе со стеклом. Багажник больше, чем у купе, и в нём пять мест." },
        { part: "glass", text: "S line — это бампер, пороги и салон, не отдельный мотор. Цифры двигателя здесь не ставим: их нет в карточке машины." }
      ]
    },
    {
      shot: "shot-a6",
      year: "2021",
      price: "320",
      name: "Audi A6",
      line: "Длинный седан на пятерых. Полный привод, место сзади и в багажнике.",
      book: "Audi A6, 2021",
      alt: "Audi A6",
      frames: null,
      facts: [["Кузов", "Седан"], ["Места", "5"], ["Мотор", "2.0"], ["Коробка", "Автомат"], ["Привод", "Полный"], ["Топливо", "Бензин"]],
      side: "assets/silhouettes/audi-a6-line.png?v=4",
      story: [
        { part: "body", text: "Для трассы и аэропорта. Сзади трое не сидят в обнимку, чемоданы встают без тетриса." },
        { part: "glass", text: "Стекло большое, капот длинный. Это рабочий седан, не витрина: ехать в нём несколько часов нормально." },
        { part: "wheel", text: "Полный привод, автомат, бензин 2.0. Лошадиные силы зависят от версии — их подтверждаем до подачи." }
      ]
    },
    {
      shot: "shot-840",
      year: "2022",
      price: "350",
      name: "BMW 840 xDrive",
      line: "Длинное гран-купе на пятерых. Полный привод, низкая посадка.",
      book: "BMW 840 xDrive, 2022",
      alt: "BMW 840 xDrive",
      frames: [
        { src: "assets/bmw-840.jpg", pos: "center 64%" },
        { src: "assets/bmw-840.jpg", pos: "38% 66%" },
        { src: "assets/bmw-840.jpg", pos: "68% 62%" }
      ],
      facts: [["Кузов", "Гран купе"], ["Места", "5"], ["Привод", "Полный"], ["Год", "2022"]],
      side: "assets/silhouettes/bmw-840-line.png?v=4",
      story: [
        { part: "body", text: "Длинное гран-купе. Пять мест и низкая посадка: на трассе лежит ровно, в тесный двор заходит осторожнее обычного седана." },
        { part: "wheel", text: "Полный привод. Топливо и отдачу мотора не дописываем — в карточке их нет, называем при брони." }
      ]
    },
    {
      shot: "shot-x4",
      year: "2022",
      price: "400",
      name: "BMW X4 M40i",
      line: "Кроссовер с мотором 3.0. Пять мест и полный привод, посадка выше седана.",
      book: "BMW X4 M40i, 2022",
      alt: "BMW X4 M40i",
      frames: [
        { src: "assets/bmw-x4.jpg", pos: "center 62%" },
        { src: "assets/bmw-x4.jpg", pos: "36% 64%" },
        { src: "assets/bmw-x4.jpg", pos: "66% 60%" }
      ],
      facts: [["Кузов", "Кроссовер"], ["Места", "5"], ["Мотор", "3.0"], ["Привод", "Полный"], ["Топливо", "Бензин"], ["Год", "2022"]],
      side: "assets/silhouettes/bmw-x4-line.png?v=3",
      story: [
        { part: "body", text: "Кроссовер с посадкой выше седана. Пять мест, сзади не купе: колени не упираются в спинку в первые десять минут." },
        { part: "lamp", text: "Мотор 3.0, бензин, полный привод. Это уже не четвёрка: на обгоне запас заметнее, чем у 230." },
        { part: "wheel", text: "Автомат и xDrive. Для города и трассы одна и та же машина, без отдельного «зимнего» тарифа." }
      ]
    },
    {
      shot: "shot-x5",
      year: "2020",
      price: "480",
      name: "BMW X5 xDrive",
      line: "Большой кроссовер. Пять мест, мотор 3.0, полный привод.",
      book: "BMW X5 xDrive, 2020",
      alt: "BMW X5 xDrive",
      frames: null,
      facts: [["Кузов", "Кроссовер"], ["Места", "5"], ["Мотор", "3.0"], ["Коробка", "Автомат"], ["Привод", "Полный"], ["Топливо", "Бензин"]],
      side: "assets/silhouettes/bmw-x5-line.png",
      story: [
        { part: "body", text: "Если людей и багажа много, это он, не X4. Задний ряд взрослый, пол багажника ровный." },
        { part: "lamp", text: "3.0, бензин, шесть цилиндров. Не дизель. Точную отдачу говорим по машине, которая свободна на ваши даты." },
        { part: "wheel", text: "xDrive и автомат. Тянет с места спокойно, это не спортивный режим ради цифры." }
      ]
    }
  ];

  if (garage && garageSlots.length && garagePhotos && garageStage) {
    var garageIndex = 0;
    var photoIndex = 0;
    var typeToken = 0;
    var photoTimer = 0;
    var frameFront = 0;
    var wipeToken = 0;
    var frameEls = [0, 1].map(function () {
      var frame = document.createElement("div");
      frame.className = "garage-frame";
      frame.innerHTML = '<span class="garage-crop"><img alt="" draggable="false"></span>';
      garagePhotos.appendChild(frame);
      return frame;
    });
    function paintSilhouette(target, car, alt) {
      if (!target) return;
      target.innerHTML = "";
      var img = document.createElement("img");
      img.src = car.side;
      img.alt = alt;
      target.appendChild(img);
    }

    function paintOutline(car) {
      paintSilhouette(garageOutline, car, "");
      paintSilhouette(garageSketch, car, car.alt);
    }

    function visibleSlots() {
      return garageSlots.filter(function (slot) { return !slot.hidden; });
    }

    function typeInto(el, text, speed, token, done) {
      var i = 0;
      if (!el) { if (done) done(); return; }
      if (reduceMotion) {
        el.textContent = text;
        el.classList.remove("is-typing");
        if (done) done();
        return;
      }
      el.textContent = "";
      el.classList.add("is-typing");
      (function tick() {
        if (token !== typeToken) return;
        el.textContent = text.slice(0, i);
        if (i < text.length) {
          i += 1;
          window.setTimeout(tick, speed);
        } else {
          el.classList.remove("is-typing");
          if (done) done();
        }
      })();
    }

    function noteText(car) {
      return car.frames
        ? "Фото этой машины — ниже. Листайте, если нужно рассмотреть."
        : "Живого кадра пока нет. Ниже — очертание, фото пришлём до подачи.";
    }

    function pinBox(el, text, blank) {
      if (!el) return;
      el.classList.remove("is-typing");
      el.style.minHeight = "0px";
      el.textContent = text;
      el.style.minHeight = el.offsetHeight + "px";
      if (blank) el.textContent = "";
    }

    function paintFacts(car, blank) {
      var values = [];
      if (!garageFacts) return values;
      garageFacts.innerHTML = "";
      car.facts.forEach(function (pair) {
        var row = document.createElement("div");
        var dt = document.createElement("dt");
        var dd = document.createElement("dd");
        dt.textContent = pair[0];
        dd.textContent = pair[1];
        row.appendChild(dt);
        row.appendChild(dd);
        garageFacts.appendChild(row);
        dd.style.minHeight = dd.offsetHeight + "px";
        if (blank) dd.textContent = "";
        values.push(dd);
      });
      return values;
    }

    function paintStory(car, blank) {
      var nodes = [];
      if (!garageStory) return nodes;
      garageStory.innerHTML = "";
      (car.story || []).forEach(function (bit) {
        var p = document.createElement("p");
        p.textContent = bit.text;
        garageStory.appendChild(p);
        p.style.minHeight = p.offsetHeight + "px";
        if (blank) p.textContent = "";
        nodes.push(p);
      });
      return nodes;
    }

    function typeChain(steps, token) {
      var i = 0;
      (function next() {
        if (token !== typeToken) return;
        if (i >= steps.length) return;
        var step = steps[i++];
        typeInto(step.el, step.text, step.speed, token, function () {
          if (step.after) step.after();
          next();
        });
      })();
    }

    function renderTicks(car) {
      if (!garageTicks) return;
      garageTicks.innerHTML = "";
      if (!car.frames || !car.frames.length) {
        garageStage.classList.add("is-single", "is-sketch");
        if (garageSketch) garageSketch.hidden = false;
        return;
      }
      garageStage.classList.remove("is-sketch");
      if (garageSketch) garageSketch.hidden = true;
      car.frames.forEach(function (_, i) {
        var tick = document.createElement("button");
        tick.type = "button";
        tick.setAttribute("aria-label", "Фото " + (i + 1));
        if (i === photoIndex) tick.className = "is-on";
        tick.addEventListener("click", function () {
          if (i === photoIndex) return;
          photoIndex = i;
          paintPhoto(true);
          armPhoto();
        });
        garageTicks.appendChild(tick);
      });
      garageStage.classList.toggle("is-single", car.frames.length < 2);
    }

    function markTick() {
      if (!garageTicks) return;
      [].forEach.call(garageTicks.children, function (tick, i) {
        tick.classList.toggle("is-on", i === photoIndex);
      });
    }

    function paintPhoto(animate) {
      var car = garageCars[garageIndex];
      if (!car || !car.frames || !car.frames.length) return;
      var token = ++wipeToken;
      var outgoing = frameEls[frameFront];
      var incoming = frameEls[frameFront ^ 1];
      var frame = car.frames[photoIndex];
      var img = incoming.querySelector("img");
      img.src = frame.src;
      img.alt = car.alt;
      img.style.setProperty("--pos", frame.pos || "center");
      if (!animate || reduceMotion) {
        frameEls.forEach(function (node) { node.classList.remove("is-on", "is-anim"); });
        incoming.classList.add("is-on");
      } else {
        outgoing.classList.add("is-on");
        outgoing.classList.remove("is-anim");
        incoming.classList.remove("is-on", "is-anim");
        void incoming.offsetWidth;
        incoming.classList.add("is-anim", "is-on");
        garageStage.classList.remove("is-wiping");
        void garageStage.offsetWidth;
        garageStage.classList.add("is-wiping");
        window.setTimeout(function () {
          if (token !== wipeToken) return;
          outgoing.classList.remove("is-on", "is-anim");
        }, 580);
      }
      frameFront ^= 1;
      markTick();
    }

    function armPhoto() {
      window.clearInterval(photoTimer);
      var car = garageCars[garageIndex];
      if (reduceMotion || !car || !car.frames || car.frames.length < 2) return;
      photoTimer = window.setInterval(function () {
        var current = garageCars[garageIndex];
        photoIndex = (photoIndex + 1) % current.frames.length;
        paintPhoto(true);
      }, 4800);
    }

    function stepPhoto(dir) {
      var car = garageCars[garageIndex];
      if (!car || !car.frames || car.frames.length < 2) return;
      photoIndex = (photoIndex + dir + car.frames.length) % car.frames.length;
      paintPhoto(true);
      armPhoto();
    }

    var garageSheet = garage.querySelector(".garage-sheet");
    var leaveTimer = 0;

    function measureHud() {
      if (!garageHud) return;
      var width = garageHud.offsetWidth;
      if (!width) return;
      var probe = document.createElement("div");
      probe.className = "garage-hud is-ready";
      probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;height:auto;min-height:0;width:" + width + "px;";
      garageHud.parentNode.appendChild(probe);
      var max = 0;
      garageCars.forEach(function (car) {
        probe.replaceChildren();
        function line(className, text, tag) {
          var el = document.createElement(tag || "p");
          el.className = className;
          el.textContent = text;
          probe.appendChild(el);
        }
        line("garage-year", car.year);
        line("garage-name", car.name, "h3");
        line("garage-price", car.price + " BYN / сутки");
        line("garage-line", car.line);
        var story = document.createElement("div");
        story.className = "garage-story";
        (car.story || []).forEach(function (bit) {
          var p = document.createElement("p");
          p.textContent = bit.text;
          story.appendChild(p);
        });
        probe.appendChild(story);
        line("garage-note", noteText(car));
        var facts = document.createElement("dl");
        facts.className = "garage-facts";
        car.facts.forEach(function (pair) {
          var row = document.createElement("div");
          var dt = document.createElement("dt");
          var dd = document.createElement("dd");
          dt.textContent = pair[0];
          dd.textContent = pair[1];
          row.appendChild(dt);
          row.appendChild(dd);
          facts.appendChild(row);
        });
        probe.appendChild(facts);
        var actions = document.createElement("div");
        actions.className = "garage-actions";
        var button = document.createElement("button");
        button.className = "btn";
        button.type = "button";
        button.textContent = "Забронировать";
        actions.appendChild(button);
        probe.appendChild(actions);
        max = Math.max(max, probe.offsetHeight);
      });
      probe.remove();
      garageHud.style.minHeight = Math.ceil(max) + "px";
    }

    function selectCar(index, typed) {
      var car = garageCars[index];
      var slot = garageSlots[index];
      if (!car || !slot || slot.hidden) return;
      garageIndex = index;
      photoIndex = 0;
      garageSlots.forEach(function (item, i) {
        var on = i === index;
        item.classList.toggle("is-on", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
      });
      garageStage.className = "garage-stage " + car.shot;
      renderTicks(car);
      paintPhoto(false);
      armPhoto();
      if (typed && garageHud) {
        var hudTop = garageHud.getBoundingClientRect().top;
        if (hudTop < 72 || hudTop > 180) {
          garageHud.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      }
      var token = ++typeToken;
      var blank = typed && !reduceMotion;
      var reveal = function () {
        if (token !== typeToken) return;
        if (garageSheet) garageSheet.classList.remove("is-out");
        var priceText = car.price + " BYN / сутки";
        var caption = noteText(car);
        pinBox(garageYear, car.year, blank);
        pinBox(garageName, car.name, blank);
        pinBox(garagePrice, priceText, blank);
        pinBox(garageLine, car.line, blank);
        if (garageBook) garageBook.setAttribute("data-car", car.book);
        paintOutline(car);
        var storyNodes = paintStory(car, blank);
        var factValues = paintFacts(car, blank);
        pinBox(garageNote, caption, blank);
        if (garageHud) garageHud.classList.remove("is-ready");
        var revealFacts = function () {
          if (token !== typeToken || !garageHud) return;
          window.requestAnimationFrame(function () { garageHud.classList.add("is-ready"); });
        };
        if (!blank) {
          revealFacts();
          return;
        }
        var steps = [
          { el: garageYear, text: car.year, speed: 36 },
          { el: garageName, text: car.name, speed: 24, after: revealFacts },
          { el: garagePrice, text: priceText, speed: 18 },
          { el: garageLine, text: car.line, speed: 11 }
        ];
        storyNodes.forEach(function (node, i) {
          steps.push({ el: node, text: car.story[i].text, speed: 9 });
        });
        steps.push({ el: garageNote, text: caption, speed: 8 });
        factValues.forEach(function (node, i) {
          steps.push({ el: node, text: car.facts[i][1], speed: 12 });
        });
        typeChain(steps, token);
      };
      if (blank && garageName && garageName.textContent && garageSheet) {
        garageSheet.classList.add("is-out");
        window.clearTimeout(leaveTimer);
        leaveTimer = window.setTimeout(reveal, 420);
        return;
      }
      if (garageSheet) garageSheet.classList.remove("is-out");
      reveal();
    }

    syncGarage = function () {
      var visible = visibleSlots();
      if (garage) garage.classList.toggle("is-empty", !visible.length);
      if (garageScreen) garageScreen.hidden = !visible.length;
      if (!visible.length) {
        window.clearInterval(photoTimer);
        return;
      }
      if (garageSlots[garageIndex] && garageSlots[garageIndex].hidden) {
        selectCar(garageSlots.indexOf(visible[0]), true);
      }
    };

    garageSlots.forEach(function (slot, index) {
      slot.addEventListener("click", function () { selectCar(index, true); });
      slot.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        var visible = visibleSlots();
        var pos = visible.indexOf(slot);
        if (pos < 0) return;
        event.preventDefault();
        var forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        var next = forward ? visible[pos + 1] || visible[0] : visible[pos - 1] || visible[visible.length - 1];
        next.focus();
        selectCar(garageSlots.indexOf(next), true);
      });
    });

    var prevBtn = garage.querySelector(".garage-prev");
    var nextBtn = garage.querySelector(".garage-next");
    if (prevBtn) prevBtn.addEventListener("click", function () { stepPhoto(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { stepPhoto(1); });
    garageStage.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); stepPhoto(1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); stepPhoto(-1); }
    });
    garageStage.addEventListener("mouseenter", function () { window.clearInterval(photoTimer); });
    garageStage.addEventListener("mouseleave", armPhoto);

    selectCar(0, false);
    measureHud();
    var hudResize = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(hudResize);
      hudResize = window.setTimeout(measureHud, 160);
    });
    if (!reduceMotion && "IntersectionObserver" in window) {
      var typedOnce = false;
      var watcher = new IntersectionObserver(function (entries) {
        if (typedOnce || !entries.some(function (entry) { return entry.isIntersecting; })) return;
        typedOnce = true;
        watcher.disconnect();
        selectCar(garageIndex, true);
      }, { threshold: 0.35 });
      watcher.observe(garage);
    }
  }
})();
