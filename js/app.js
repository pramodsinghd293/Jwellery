/* Rivaayat front-end — pages, filters, calculator, seller flow, orders */

const App = {
  init() {
    this.page = document.body.dataset.page || "home";
    this.renderChrome();
    this.bindGlobal();
    const run = this["page_" + this.page];
    if (typeof run === "function") run.call(this);
    this.updateBadges();
  },

  qs: new URLSearchParams(location.search),

  renderChrome() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (header) header.innerHTML = this.headerHTML();
    if (footer) footer.innerHTML = this.footerHTML();
    this.renderTicker();
    if (!document.querySelector(".floaters")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div class="floaters">
          <a href="contact.html" title="Talk to us">✉</a>
          <button type="button" data-top title="Back to top">↑</button>
        </div>
        <div class="toast" id="toast"></div>`
      );
    }
  },

  headerHTML() {
    const p = this.page;
    const link = (href, page, label) =>
      `<a href="${href}" class="${p === page ? "active" : ""}">${label}</a>`;
    return `
      <div class="ticker"><div class="ticker-track" id="ticker-track"></div></div>
      <div class="wrap header-row">
        <a class="brand" href="index.html">
          <img src="assets/brand-emblem.png" alt="Rivaayat emblem">
          <div class="brand-name">Rivaayat<span>Independent jewellers</span></div>
        </a>
        <form class="search" action="catalogue.html">
          <input name="q" placeholder="Search haar, solitaire, bridal set, shop…" value="${this.esc(this.qs.get("q") || "")}">
          <button type="submit">Search</button>
        </form>
        <div class="header-tools">
          <a class="icon-btn hide-sm" href="stores.html">Stores</a>
          <a class="icon-btn hide-sm" href="seller.html">Sell</a>
          <a class="icon-btn" href="cart.html" title="Bag">Bag <span class="badge" data-cart-count>0</span></a>
          <button type="button" class="icon-btn menu-toggle" data-menu>Menu</button>
        </div>
      </div>
      <nav class="nav wrap" id="main-nav">
        ${link("index.html", "home", "Home")}
        ${link("catalogue.html", "catalogue", "Jewellery")}
        ${link("catalogue.html?category=gold", "gold", "Gold")}
        ${link("catalogue.html?category=diamond", "diamond", "Diamond")}
        ${link("catalogue.html?category=bridal", "bridal", "Bridal")}
        ${link("stores.html", "stores", "Jewellers")}
        ${link("calculator.html", "calculator", "Calculator")}
        ${link("seller.html", "seller", "Register shop")}
        ${link("about.html", "about", "About")}
      </nav>`;
  },

  footerHTML() {
    const b = RIVAAYAT.brand;
    return `
      <div class="wrap foot-grid">
        <div>
          <h3>Rivaayat</h3>
          <p>A storefront for independent jewellers who do not have a website of their own. Clients browse, calculate making + GST, and place the order with the shop — not a warehouse.</p>
          <p>${b.address}<br>${b.phone}<br><a href="mailto:${b.supportEmail}">${b.supportEmail}</a></p>
        </div>
        <div>
          <h3>Browse</h3>
          <p><a href="catalogue.html">All jewellery</a><br>
          <a href="stores.html">Local jewellers</a><br>
          <a href="calculator.html">Making & GST calculator</a><br>
          <a href="catalogue.html?best=1">Bestsellers</a></p>
        </div>
        <div>
          <h3>For shops</h3>
          <p><a href="seller.html">Register as a seller</a><br>
          <a href="publish.html">Publish a design</a><br>
          <a href="seller.html#themes">Four storefront designs</a><br>
          <a href="contact.html">Talk to the desk</a></p>
        </div>
        <div>
          <h3>Today in ${RIVAAYAT.rates.city}</h3>
          <p>24K ${inr(RIVAAYAT.rates.metals["24K"].perGram)}/g<br>
          22K ${inr(RIVAAYAT.rates.metals["22K"].perGram)}/g<br>
          Silver ${inr(RIVAAYAT.rates.metals.Silver.perGram)}/g<br>
          Updated ${RIVAAYAT.rates.date}</p>
        </div>
      </div>
      <div class="wrap legal">Rivaayat is a directory and order desk for independent shops. Rates are indicative for ${RIVAAYAT.rates.city}. Final invoice is always raised by the jeweller. Hallmark, purity and GST must appear on the bill.</div>`;
  },

  renderTicker() {
    const el = document.getElementById("ticker-track");
    if (!el) return;
    const parts = Object.entries(RIVAAYAT.rates.metals).map(([k, v]) => {
      const d = v.perGram - v.prev;
      const cls = d >= 0 ? "up" : "down";
      const sign = d >= 0 ? "▲" : "▼";
      return `<b>${v.label}</b> ${inr(v.perGram)}/${v.unit} <span class="${cls}">${sign} ${inr(Math.abs(d))}</span>`;
    });
    const line =
      ` ●  ${RIVAAYAT.rates.city} jewellery rates · ${RIVAAYAT.rates.date}  ●  ` +
      parts.join("    ·    ") +
      "    ·    GST 3% on metal + 5% on making    ·    Hallmark ₹45/piece    ·    ";
    el.innerHTML = line + line;
  },

  bindGlobal() {
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-menu]")) {
        document.getElementById("main-nav")?.classList.toggle("open");
      }
      if (e.target.closest("[data-top]")) window.scrollTo({ top: 0, behavior: "smooth" });
      const wish = e.target.closest("[data-wish]");
      if (wish) {
        e.preventDefault();
        const on = Store.toggleWish(wish.dataset.wish);
        wish.classList.toggle("on", on);
        this.toast(on ? "Saved to wishlist" : "Removed from wishlist");
      }
      const cart = e.target.closest("[data-cart]");
      if (cart) {
        e.preventDefault();
        Store.addCart(cart.dataset.cart);
        this.updateBadges();
        this.toast("Added to bag");
      }
    });
  },

  updateBadges() {
    const n = Store.getCart().reduce((s, c) => s + c.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((el) => (el.textContent = n));
  },

  toast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(this._t);
    this._t = setTimeout(() => el.classList.remove("on"), 2200);
  },

  esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  },

  shopName(id) {
    return (getShop(id) || {}).name || "Independent jeweller";
  },

  productCard(p) {
    const total = productTotal(p);
    const wished = Store.getWishlist().includes(p.id);
    return `<article class="prod-card">
      ${p.bestseller ? `<span class="chip">Bestseller</span>` : ""}
      <button class="wish ${wished ? "on" : ""}" data-wish="${p.id}" aria-label="Wishlist">♥</button>
      <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${p.image}" alt="${this.esc(p.name)}"></a>
      <div class="prod-body">
        <div class="prod-shop"><a href="shop.html?id=${p.shopId}">${this.esc(this.shopName(p.shopId))}</a></div>
        <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${this.esc(p.name)}</a></h3>
        <div class="muted">${p.purity} · ${p.weight} g · ${p.type}</div>
        <div class="price">${inr(total)}<small>Metal + making + GST · live ${RIVAAYAT.rates.date}</small></div>
        <div class="btn-row">
          <a class="btn btn-gold" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
          <button class="btn btn-ghost" data-cart="${p.id}">Bag</button>
        </div>
      </div>
    </article>`;
  },

  shopCard(s) {
    return `<article class="shop-card">
      <header>
        <div>
          <div class="verified">${s.verified ? "Verified jeweller" : "New on Rivaayat"} · Est. ${s.since}</div>
          <h3><a href="shop.html?id=${s.id}">${this.esc(s.name)}</a></h3>
          <div class="muted">${this.esc(s.area)}, ${s.city}</div>
        </div>
        <div class="rating">${stars(s.rating)}<br><span>${s.reviews ? s.rating.toFixed(1) + " · " + s.reviews + " ratings" : "New on Rivaayat"}</span></div>
      </header>
      <p>${this.esc(s.about)}</p>
      <div class="tags">${(s.specialty || []).map((t) => `<span class="tag">${t}</span>`).join("")}
        <span class="tag">Making ${s.makingPct}%</span>
      </div>
      <div class="btn-row">
        <a class="btn btn-wine" href="shop.html?id=${s.id}">Open storefront</a>
        <a class="btn btn-ghost" href="calculator.html?shop=${s.id}">Use their rates</a>
      </div>
    </article>`;
  },

  /* ---------- pages ---------- */

  page_home() {
    const featured = allProducts().filter((p) => p.featured);
    const best = allProducts().filter((p) => p.bestseller);
    const shops = allShops().slice().sort((a, b) => b.rating - a.rating).slice(0, 6);

    const cat = document.getElementById("cat-grid");
    if (cat) {
      cat.innerHTML = RIVAAYAT.categories
        .map(
          (c) => `<a class="cat-card" href="catalogue.html?category=${c.id}">
          <img src="${c.image}" alt="${c.name}">
          <figcaption><h3>${c.name}</h3><p>${c.blurb}</p></figcaption>
        </a>`
        )
        .join("");
    }
    const feat = document.getElementById("featured-grid");
    if (feat) feat.innerHTML = featured.map((p) => this.productCard(p)).join("");
    const bestEl = document.getElementById("best-grid");
    if (bestEl) bestEl.innerHTML = best.slice(0, 8).map((p) => this.productCard(p)).join("");
    const shopEl = document.getElementById("shop-grid");
    if (shopEl) shopEl.innerHTML = shops.map((s) => this.shopCard(s)).join("");
    const themeEl = document.getElementById("theme-grid");
    if (themeEl) {
      themeEl.innerHTML = RIVAAYAT.themes
        .map(
          (t) => `<a class="theme-card theme-${t.id}" href="seller.html?theme=${t.id}">
          <p class="kicker">${t.subtitle}</p>
          <h3>${t.name}</h3>
          <p>${t.desc}</p>
        </a>`
        )
        .join("");
    }
    const quotes = document.getElementById("quotes");
    if (quotes) {
      quotes.innerHTML = RIVAAYAT.testimonials
        .map(
          (q) => `<article class="quote">
          <div class="rating">${stars(q.rating)}</div>
          <p>“${q.text}”</p>
          <div class="muted">${q.name} · ${q.area}</div>
        </article>`
        )
        .join("");
    }
    this.initHero();
    this.initWelcomeModal();
  },

  initHero() {
    const slides = document.querySelectorAll(".hero-slide");
    if (!slides.length) return;
    let i = 0;
    const show = (n) => {
      slides.forEach((s, idx) => s.classList.toggle("on", idx === n));
    };
    show(0);
    document.querySelector("[data-hero-next]")?.addEventListener("click", () => {
      i = (i + 1) % slides.length;
      show(i);
    });
    document.querySelector("[data-hero-prev]")?.addEventListener("click", () => {
      i = (i + slides.length - 1) % slides.length;
      show(i);
    });
    setInterval(() => {
      i = (i + 1) % slides.length;
      show(i);
    }, 7000);
  },

  initWelcomeModal() {
    if (sessionStorage.getItem("rivaayat-welcome")) return;
    const back = document.getElementById("welcome-modal");
    if (!back) return;
    back.classList.add("on");
    back.addEventListener("click", (e) => {
      if (e.target === back || e.target.closest("[data-close-modal]")) {
        back.classList.remove("on");
        sessionStorage.setItem("rivaayat-welcome", "1");
      }
    });
  },

  page_catalogue() {
    const box = document.getElementById("catalogue-grid");
    const meta = document.getElementById("result-meta");
    const apply = () => {
      const f = {
        q: (document.getElementById("f-q")?.value || this.qs.get("q") || "").toLowerCase(),
        category: document.getElementById("f-category")?.value || this.qs.get("category") || "",
        type: document.getElementById("f-type")?.value || "",
        purity: document.getElementById("f-purity")?.value || "",
        occasion: document.getElementById("f-occasion")?.value || "",
        shop: document.getElementById("f-shop")?.value || this.qs.get("shop") || "",
        gender: document.getElementById("f-gender")?.value || "",
        best: document.getElementById("f-best")?.checked || this.qs.get("best") === "1",
        min: Number(document.getElementById("f-min")?.value || 0),
        max: Number(document.getElementById("f-max")?.value || 0),
        wmin: Number(document.getElementById("f-wmin")?.value || 0),
        wmax: Number(document.getElementById("f-wmax")?.value || 0),
      };
      let list = allProducts();
      list = list.filter((p) => {
        const total = productTotal(p);
        const shop = getShop(p.shopId);
        const blob = (p.name + " " + p.description + " " + (shop ? shop.name : "")).toLowerCase();
        if (f.q && !blob.includes(f.q)) return false;
        if (f.category && p.category !== f.category) return false;
        if (f.type && p.type !== f.type) return false;
        if (f.purity && p.purity !== f.purity) return false;
        if (f.occasion && p.occasion !== f.occasion) return false;
        if (f.shop && p.shopId !== f.shop) return false;
        if (f.gender && p.gender !== f.gender) return false;
        if (f.best && !p.bestseller) return false;
        if (f.min && total < f.min) return false;
        if (f.max && total > f.max) return false;
        if (f.wmin && p.weight < f.wmin) return false;
        if (f.wmax && p.weight > f.wmax) return false;
        return true;
      });
      const sort = document.getElementById("f-sort")?.value || "featured";
      list.sort((a, b) => {
        if (sort === "price-asc") return productTotal(a) - productTotal(b);
        if (sort === "price-desc") return productTotal(b) - productTotal(a);
        if (sort === "weight") return b.weight - a.weight;
        if (sort === "best") return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
      if (meta) meta.textContent = list.length + " designs from " + new Set(list.map((p) => p.shopId)).size + " jewellers";
      if (box) box.innerHTML = list.length ? list.map((p) => this.productCard(p)).join("") : `<div class="empty">No jewellery matches these filters. Clear a filter or browse all shops.</div>`;
    };

    const shopSel = document.getElementById("f-shop");
    if (shopSel && shopSel.options.length < 2) {
      allShops().forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.name;
        shopSel.appendChild(o);
      });
    }
    ["f-q", "f-category", "f-type", "f-purity", "f-occasion", "f-shop", "f-gender", "f-best", "f-min", "f-max", "f-wmin", "f-wmax", "f-sort"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", apply);
      document.getElementById(id)?.addEventListener("change", apply);
    });
    if (this.qs.get("category")) {
      const el = document.getElementById("f-category");
      if (el) el.value = this.qs.get("category");
    }
    if (this.qs.get("shop")) {
      const el = document.getElementById("f-shop");
      if (el) el.value = this.qs.get("shop");
    }
    if (this.qs.get("q")) {
      const el = document.getElementById("f-q");
      if (el) el.value = this.qs.get("q");
    }
    if (this.qs.get("best") === "1") {
      const el = document.getElementById("f-best");
      if (el) el.checked = true;
    }
    apply();
  },

  page_product() {
    const id = this.qs.get("id");
    const p = getProduct(id);
    const root = document.getElementById("product-root");
    if (!root) return;
    if (!p) {
      root.innerHTML = `<div class="empty">This design is no longer listed. <a href="catalogue.html">Browse jewellery</a></div>`;
      return;
    }
    const shop = getShop(p.shopId);
    if (!shop) {
      root.innerHTML = `<div class="empty">The jeweller for this piece is no longer listed.</div>`;
      return;
    }
    const billHTML = (b) => `
      <div class="bill" id="prod-bill" style="margin-top:16px">
        <div><span>Metal value</span><b>${inr(b.metalValue)}</b></div>
        <div><span>Wastage</span><b>${inr(b.wastage)}</b></div>
        <div><span>Making charges</span><b>${inr(b.making)}</b></div>
        <div><span>Stones / extra</span><b>${inr(b.stone)}</b></div>
        <div><span>GST ${RIVAAYAT.rates.gstMetal}% on metal</span><b>${inr(b.gstMetal)}</b></div>
        <div><span>GST ${RIVAAYAT.rates.gstMaking}% on making</span><b>${inr(b.gstMaking)}</b></div>
        <div><span>Hallmark</span><b>${inr(b.hallmark)}</b></div>
        <div class="total"><span>Payable (estimate)</span><b>${inr(b.total)}</b></div>
      </div>`;
    const b0 = priceBreakdown(p);
    root.innerHTML = `
      <div class="product-layout">
        <div class="product-photo"><img src="${p.image}" alt="${this.esc(p.name)}"></div>
        <div>
          <p class="eyebrow">${p.category} · ${p.occasion}</p>
          <h1>${this.esc(p.name)}</h1>
          <p class="muted">${p.purity} ${p.metal} · ${p.weight} g · ${p.type} · ${p.gender}</p>
          <p><a href="shop.html?id=${p.shopId}">${this.esc(shop.name)}</a> · ${shop.area}<br>
            <span class="rating">${stars(shop.rating)}</span> <span class="muted">${shop.rating} (${shop.reviews})</span>
          </p>
          <p>${this.esc(p.description)}</p>
          <div class="panel">
            <h3>Live estimate with ${this.esc(shop.name)}</h3>
            <p class="muted">Uses today's ${RIVAAYAT.rates.city} ${p.purity} rate of ${inr(b0.rate)}/g, this shop's making ${b0.makingPct}% and wastage ${b0.wastagePct}%.</p>
            <form class="form two" id="tune">
              <label>Weight (g)<input name="weight" type="number" step="0.1" value="${p.weight}"></label>
              <label>Making %<input name="makingPct" type="number" step="0.1" value="${p.makingPct}"></label>
              <label>Wastage %<input name="wastagePct" type="number" step="0.1" value="${p.wastagePct}"></label>
              <label>Stone charges<input name="stoneCharges" type="number" value="${p.stoneCharges}"></label>
            </form>
            ${billHTML(b0)}
          </div>
          <div class="btn-row" style="margin-top:18px">
            <button class="btn btn-gold" data-cart="${p.id}">Add to bag</button>
            <a class="btn btn-wine" href="https://wa.me/${shop.whatsapp}?text=${encodeURIComponent("Hello " + shop.name + ", I want to order " + p.name + " (" + p.id + ") from Rivaayat.")}" target="_blank" rel="noopener">WhatsApp shop</a>
            <a class="btn btn-ghost" href="tel:${shop.phone.replace(/\s/g, "")}">Call</a>
          </div>
          <form class="panel form" id="order-form" style="margin-top:22px">
            <h3>Place order with the jeweller</h3>
            <p class="muted">The shop receives this enquiry. You talk to them directly — Rivaayat does not warehouse stock.</p>
            <label>Your name<input name="name" required></label>
            <label>Mobile<input name="phone" required placeholder="10-digit"></label>
            <label>City / visit preference<input name="city" value="Bhopal"></label>
            <label>Note<textarea name="note" placeholder="Size, date needed, old-gold exchange…"></textarea></label>
            <button class="btn btn-dark" type="submit">Send order to ${this.esc(shop.name)}</button>
          </form>
        </div>
      </div>`;
    const readTune = () => {
      const form = document.getElementById("tune");
      const fd = new FormData(form);
      return priceBreakdown(p, {
        weight: fd.get("weight"),
        makingPct: fd.get("makingPct"),
        wastagePct: fd.get("wastagePct"),
        stoneCharges: fd.get("stoneCharges"),
      });
    };
    document.getElementById("tune")?.addEventListener("input", () => {
      document.getElementById("prod-bill").outerHTML = billHTML(readTune());
    });
    document.getElementById("order-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const b = readTune();
      const order = {
        id: "ORD-" + Date.now(),
        productId: p.id,
        product: p.name,
        shopId: shop.id,
        shop: shop.name,
        total: Math.round(b.total),
        name: fd.get("name"),
        phone: fd.get("phone"),
        city: fd.get("city"),
        note: fd.get("note"),
        at: new Date().toISOString(),
      };
      Store.push("orders", order);
      const subject = encodeURIComponent("Rivaayat order " + order.id + " — " + p.name);
      const body = encodeURIComponent(
        `Order ${order.id}\nPiece: ${p.name}\nShop: ${shop.name}\nEstimate: ${inr(b.total)}\nCustomer: ${order.name}\nPhone: ${order.phone}\nCity: ${order.city}\nNote: ${order.note}`
      );
      window.location.href = `mailto:${shop.email}?subject=${subject}&body=${body}`;
      this.toast("Order saved. Opening mail to the shop…");
    });
    const more = document.getElementById("more-grid");
    if (more) {
      more.innerHTML = allProducts()
        .filter((x) => x.shopId === p.shopId && x.id !== p.id)
        .slice(0, 4)
        .map((x) => this.productCard(x))
        .join("");
    }
  },

  page_stores() {
    const grid = document.getElementById("stores-grid");
    const apply = () => {
      const q = (document.getElementById("s-q")?.value || "").toLowerCase();
      const area = document.getElementById("s-area")?.value || "";
      const spec = document.getElementById("s-spec")?.value || "";
      const minR = Number(document.getElementById("s-rating")?.value || 0);
      let list = allShops();
      list = list.filter((s) => {
        const blob = (s.name + " " + s.area + " " + s.about + " " + (s.specialty || []).join(" ")).toLowerCase();
        if (q && !blob.includes(q)) return false;
        if (area && s.area !== area) return false;
        if (spec && !(s.specialty || []).includes(spec)) return false;
        if (minR && s.rating < minR) return false;
        return true;
      });
      list.sort((a, b) => b.rating - a.rating);
      const meta = document.getElementById("stores-meta");
      if (meta) meta.textContent = list.length + " jewellers in Bhopal";
      if (grid) grid.innerHTML = list.map((s) => this.shopCard(s)).join("");
    };
    const areaSel = document.getElementById("s-area");
    if (areaSel && areaSel.options.length < 2) {
      [...new Set(allShops().map((s) => s.area))].forEach((a) => {
        const o = document.createElement("option");
        o.value = a;
        o.textContent = a;
        areaSel.appendChild(o);
      });
    }
    ["s-q", "s-area", "s-spec", "s-rating"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", apply);
      document.getElementById(id)?.addEventListener("change", apply);
    });
    apply();
  },

  page_shop() {
    const shop = getShop(this.qs.get("id"));
    const root = document.getElementById("shop-root");
    if (!root) return;
    if (!shop) {
      root.innerHTML = `<div class="empty">Shop not found. <a href="stores.html">See jewellers</a></div>`;
      return;
    }
    document.body.classList.add("storefront", "theme-" + shop.theme);
    const products = allProducts().filter((p) => p.shopId === shop.id);
    const reviews = RIVAAYAT.reviews[shop.id] || [];
    root.innerHTML = `
      <header class="shop-hero">
        <div class="wrap">
          <p class="kicker">${shop.verified ? "Verified" : "New"} · ${shop.theme} storefront · Est. ${shop.since}</p>
          <h1>${this.esc(shop.name)}</h1>
          <p>${this.esc(shop.about)}</p>
          <p class="rating">${stars(shop.rating)} ${shop.reviews ? Number(shop.rating).toFixed(1) + " · " + shop.reviews + " ratings" : "Awaiting first ratings"} · ${shop.area}</p>
          <div class="btn-row">
            <a class="btn btn-gold" href="tel:${shop.phone.replace(/\s/g, "")}">${shop.phone}</a>
            <a class="btn btn-ghost" href="https://wa.me/${shop.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>
            <a class="btn btn-ghost" href="calculator.html?shop=${shop.id}">Calculate with this shop</a>
          </div>
        </div>
      </header>
      <section class="section">
        <div class="wrap">
          <div class="stat-row">
            <div class="stat"><span class="muted">Making</span><b>${shop.makingPct}%</b></div>
            <div class="stat"><span class="muted">Wastage</span><b>${shop.wastagePct}%</b></div>
            <div class="stat"><span class="muted">Hours</span><b style="font-size:16px">${shop.hours}</b></div>
            <div class="stat"><span class="muted">Address</span><b style="font-size:15px">${this.esc(shop.address)}</b></div>
          </div>
          <div class="tags" style="margin:12px 0 28px">${(shop.highlights || []).map((h) => `<span class="tag">${h}</span>`).join("")}</div>
          <div class="section-head"><div><p class="eyebrow">Catalogue</p><h2>Designs from this shop</h2></div>
            <a class="btn btn-ghost" href="catalogue.html?shop=${shop.id}">Filter all</a></div>
          <div class="prod-grid">${products.length ? products.map((p) => this.productCard(p)).join("") : `<div class="empty">No designs published yet.</div>`}</div>
          <div class="section-head" style="margin-top:48px"><div><p class="eyebrow">Ratings</p><h2>What clients say</h2></div></div>
          <div class="quote-grid">${reviews.map((r) => `<article class="quote"><div class="rating">${stars(r.rating)}</div><p>“${r.text}”</p><div class="muted">${r.name}</div></article>`).join("") || `<div class="empty">No reviews yet.</div>`}</div>
        </div>
      </section>`;
  },

  page_calculator() {
    const shopSel = document.getElementById("c-shop");
    if (shopSel && shopSel.options.length < 2) {
      allShops().forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = `${s.name} · making ${s.makingPct}%`;
        shopSel.appendChild(o);
      });
    }
    const pre = this.qs.get("shop");
    if (pre && shopSel) shopSel.value = pre;
    const form = document.getElementById("calc-form");
    const out = document.getElementById("calc-out");
    const run = () => {
      const shop = getShop(shopSel.value) || allShops()[0];
      const purity = document.getElementById("c-purity").value;
      const weight = Number(document.getElementById("c-weight").value || 0);
      const makingPct = Number(document.getElementById("c-making").value || shop.makingPct);
      const wastagePct = Number(document.getElementById("c-wastage").value || shop.wastagePct);
      const stone = Number(document.getElementById("c-stone").value || 0);
      const dummy = { purity, weight, makingPct, wastagePct, stoneCharges: stone, shopId: shop.id };
      const b = priceBreakdown(dummy);
      if (out) {
        out.innerHTML = `
          <p class="eyebrow">${shop.name}</p>
          <h3>Estimate for ${weight} g ${purity}</h3>
          <p class="muted">Rate ${inr(b.rate)}/g · ${RIVAAYAT.rates.date} · ${RIVAAYAT.rates.city}</p>
          <div class="bill">
            <div><span>Metal value</span><b>${inr(b.metalValue)}</b></div>
            <div><span>Wastage ${wastagePct}%</span><b>${inr(b.wastage)}</b></div>
            <div><span>Making ${makingPct}%</span><b>${inr(b.making)}</b></div>
            <div><span>Stones</span><b>${inr(b.stone)}</b></div>
            <div><span>GST ${RIVAAYAT.rates.gstMetal}% on metal</span><b>${inr(b.gstMetal)}</b></div>
            <div><span>GST ${RIVAAYAT.rates.gstMaking}% on making</span><b>${inr(b.gstMaking)}</b></div>
            <div><span>Hallmark</span><b>${inr(b.hallmark)}</b></div>
            <div class="total"><span>Total payable</span><b>${inr(b.total)}</b></div>
          </div>
          <p class="muted" style="margin-top:12px">Ask the jeweller to print metal, making and both GST lines separately on the invoice.</p>
          <a class="btn btn-wine" href="shop.html?id=${shop.id}">Open ${this.esc(shop.name)}</a>`;
      }
    };
    shopSel?.addEventListener("change", () => {
      const shop = getShop(shopSel.value);
      if (!shop) return;
      document.getElementById("c-making").value = shop.makingPct;
      document.getElementById("c-wastage").value = shop.wastagePct;
      run();
    });
    form?.addEventListener("input", run);
    if (pre) {
      const shop = getShop(pre);
      if (shop) {
        document.getElementById("c-making").value = shop.makingPct;
        document.getElementById("c-wastage").value = shop.wastagePct;
      }
    }
    run();
  },

  page_seller() {
    const themeSel = document.getElementById("seller-theme");
    const pre = this.qs.get("theme");
    if (pre && themeSel) themeSel.value = pre;
    const form = document.getElementById("seller-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const shop = {
        id: "shop-" + Date.now(),
        name: String(fd.get("name")).trim(),
        area: String(fd.get("area")).trim(),
        city: String(fd.get("city") || "Bhopal").trim(),
        address: String(fd.get("address")).trim(),
        phone: String(fd.get("phone")).trim(),
        whatsapp: String(fd.get("phone")).replace(/\D/g, ""),
        email: String(fd.get("email")).trim(),
        since: Number(fd.get("since")) || new Date().getFullYear(),
        specialty: String(fd.get("specialty") || "Gold").split(",").map((s) => s.trim()).filter(Boolean),
        theme: String(fd.get("theme") || "heritage"),
        rating: 0,
        reviews: 0,
        verified: false,
        makingPct: Number(fd.get("makingPct")) || 12,
        wastagePct: Number(fd.get("wastagePct")) || 2,
        hours: String(fd.get("hours") || "11:00 AM – 8:00 PM"),
        about: String(fd.get("about") || ""),
        highlights: ["Pending verification"],
        pending: true,
      };
      Store.push("shops", shop);
      const subject = encodeURIComponent("Rivaayat seller registration — " + shop.name);
      const body = encodeURIComponent(
        `Shop: ${shop.name}\nArea: ${shop.area}, ${shop.city}\nAddress: ${shop.address}\nPhone: ${shop.phone}\nEmail: ${shop.email}\nSince: ${shop.since}\nSpecialty: ${shop.specialty.join(", ")}\nTheme: ${shop.theme}\nMaking: ${shop.makingPct}%\nWastage: ${shop.wastagePct}%\nAbout: ${shop.about}\n\nPlease onboard this jeweller on Rivaayat.`
      );
      const mail = RIVAAYAT.brand.supportEmail;
      window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
      const done = document.getElementById("seller-done");
      if (done) {
        done.hidden = false;
        done.innerHTML = `<div class="notice">Saved locally as a pending shop. A mail draft to <b>${mail}</b> should open so the desk can verify you. Meanwhile you can <a href="publish.html">publish a design</a> or preview <a href="shop.html?id=${shop.id}">your storefront</a>.</div>`;
      }
    });
  },

  page_publish() {
    const shopSel = document.getElementById("pub-shop");
    if (shopSel) {
      allShops().forEach((s) => {
        const o = document.createElement("option");
        o.value = s.id;
        o.textContent = s.name;
        shopSel.appendChild(o);
      });
    }
    document.getElementById("publish-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const shop = getShop(fd.get("shopId"));
      const product = {
        id: "p-" + Date.now(),
        name: String(fd.get("name")).trim(),
        shopId: String(fd.get("shopId")),
        category: String(fd.get("category")),
        type: String(fd.get("type")),
        metal: String(fd.get("metal") || "Gold"),
        purity: String(fd.get("purity")),
        weight: Number(fd.get("weight")),
        makingPct: Number(fd.get("makingPct")) || (shop ? shop.makingPct : 12),
        wastagePct: Number(fd.get("wastagePct")) || (shop ? shop.wastagePct : 2),
        stoneCharges: Number(fd.get("stoneCharges")) || 0,
        occasion: String(fd.get("occasion")),
        gender: String(fd.get("gender") || "Women"),
        bestseller: false,
        featured: true,
        image: "assets/" + String(fd.get("image") || "cat-gold.png"),
        description: String(fd.get("description") || ""),
      };
      Store.push("products", product);
      this.toast("Design published on this browser");
      location.href = "product.html?id=" + encodeURIComponent(product.id);
    });
  },

  page_cart() {
    const root = document.getElementById("cart-root");
    if (!root) return;
    const render = () => {
      const cart = Store.getCart();
      if (!cart.length) {
        root.innerHTML = `<div class="empty">Your bag is empty. <a href="catalogue.html">Browse jewellery</a></div>`;
        return;
      }
      let grand = 0;
      const rows = cart
        .map((c) => {
          const p = getProduct(c.id);
          if (!p) return "";
          const t = productTotal(p) * c.qty;
          grand += t;
          return `<article class="shop-card" style="display:grid;grid-template-columns:120px 1fr auto;gap:16px;align-items:center">
            <img src="${p.image}" alt="" style="height:110px;width:120px;object-fit:cover;border-radius:12px">
            <div>
              <h3><a href="product.html?id=${p.id}">${this.esc(p.name)}</a></h3>
              <div class="muted">${this.shopName(p.shopId)} · ${p.weight} g · qty ${c.qty}</div>
              <div class="price">${inr(t)}</div>
            </div>
            <div class="btn-row" style="flex-direction:column">
              <button class="btn btn-ghost" data-qty="${p.id}" data-dir="-1">–</button>
              <button class="btn btn-ghost" data-qty="${p.id}" data-dir="1">+</button>
            </div>
          </article>`;
        })
        .join("");
      root.innerHTML = rows + `<div class="panel" style="margin-top:18px"><div class="bill"><div class="total"><span>Bag total (estimate)</span><b>${inr(grand)}</b></div></div>
        <p class="muted">Each piece is fulfilled by its own jeweller. Open the product to place the order with that shop.</p></div>`;
    };
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-qty]");
      if (!btn) return;
      const cart = Store.getCart();
      const row = cart.find((c) => c.id === btn.dataset.qty);
      if (!row) return;
      row.qty += Number(btn.dataset.dir);
      const next = cart.filter((c) => c.qty > 0);
      Store.setCart(next);
      this.updateBadges();
      render();
    });
    const orders = Store.getOrders();
    const ol = document.getElementById("orders-list");
    if (ol) {
      ol.innerHTML = orders.length
        ? orders
            .map(
              (o) => `<article class="shop-card"><div class="verified">${o.id}</div><h3>${this.esc(o.product)}</h3>
            <p>${this.esc(o.shop)} · ${inr(o.total)}<br><span class="muted">${this.esc(o.name)} · ${this.esc(o.phone)}</span></p></article>`
            )
            .join("")
        : `<div class="empty">No orders placed on this browser yet.</div>`;
    }
    render();
  },

  page_about() {},
  page_contact() {
    document.getElementById("contact-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const mail = RIVAAYAT.brand.supportEmail;
      const subject = encodeURIComponent("Rivaayat enquiry — " + fd.get("name"));
      const body = encodeURIComponent(`${fd.get("name")}\n${fd.get("phone")}\n${fd.get("email")}\n\n${fd.get("message")}`);
      window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
    });
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
