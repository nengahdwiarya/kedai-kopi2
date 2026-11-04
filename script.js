/* Kenangan Senja — interaksi website */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const rupiah = (value) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(value);
  const parsePrice = (text) => {
    const match = String(text).replace(/\./g, '').match(/[\d]+/);
    return match ? Number(match[0]) * (/\bK\b/i.test(text) ? 1000 : 1) : 0;
  };
  const toast = (message) => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  };

  // Tahun footer
  $('#current-year') && ($('#current-year').textContent = new Date().getFullYear());

  // Navigasi mobile
  const navbarNav = $('.navbar-nav');
  const hamburger = $('#hamburger-menu');
  hamburger?.addEventListener('click', (event) => {
    event.preventDefault();
    navbarNav.classList.toggle('active');
  });
  $$('.navbar-nav a').forEach(link => link.addEventListener('click', () => navbarNav.classList.remove('active')));

  // Search: filter menu dan produk secara langsung
  const searchForm = $('.search-form');
  const searchBox = $('#search-box');
  const searchButton = $('#search-button');
  searchButton?.addEventListener('click', (event) => {
    event.preventDefault();
    searchForm.classList.toggle('active');
    if (searchForm.classList.contains('active')) searchBox?.focus();
    else if (searchBox) { searchBox.value = ''; filterItems(''); }
  });
  $('#clear-search')?.addEventListener('click', () => {
    searchBox.value = '';
    filterItems('');
    searchBox.focus();
  });
  function filterItems(query) {
    const q = query.trim().toLocaleLowerCase('id');
    let visible = 0;
    $$('.menu-card, .product-card').forEach(card => {
      const matches = card.textContent.toLocaleLowerCase('id').includes(q);
      card.hidden = !matches;
      if (matches) visible++;
    });
    let message = $('#search-empty');
    if (!message) {
      message = document.createElement('p');
      message.id = 'search-empty';
      message.className = 'empty-search';
      message.textContent = 'Tidak ada menu atau produk yang cocok.';
      $('.menu .row')?.after(message);
    }
    message.hidden = !q || visible > 0;
  }
  searchBox?.addEventListener('input', () => filterItems(searchBox.value));

  // Keranjang belanja, disimpan di browser
  const cart = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem('kenanganSenjaCart') || '[]');
    saved.forEach(item => {
      if (item && item.id && item.name && Number(item.price) > 0 && Number(item.qty) > 0) {
        cart.set(item.id, { ...item, price: Number(item.price), qty: Number(item.qty) });
      }
    });
  } catch (_) {}
  const cartPanel = $('.shopping-cart');
  $('#shopping-cart-button')?.addEventListener('click', event => {
    event.preventDefault();
    cartPanel.classList.toggle('active');
  });

  const menuCards = $$('.menu-card');
  menuCards.forEach((card, index) => {
    const name = ($('.menu-card-title', card)?.textContent || 'Menu').replace(/-/g, '').trim();
    const price = parsePrice($('.menu-card-price', card)?.textContent || '0');
    const image = $('img', card)?.getAttribute('src') || '';
    card.dataset.itemName = name;
    card.dataset.itemPrice = String(price);
    card.dataset.itemId = `menu-${index}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn small-btn add-menu-button';
    button.textContent = 'Tambah ke keranjang';
    button.setAttribute('aria-label', `Tambah ${name} ke keranjang`);
    button.addEventListener('click', () => addToCart({ id: card.dataset.itemId, name, price, image }));
    card.append(button);
  });

  const productCards = $$('.product-card');
  productCards.forEach((card, index) => {
    const name = ($('.product-content h3', card)?.textContent || `Produk ${index + 1}`).trim();
    const price = parsePrice($('.product-price', card)?.childNodes[0]?.textContent || $('.product-price', card)?.textContent || '0');
    const image = $('img', card)?.getAttribute('src') || '';
    card.dataset.itemName = name;
    card.dataset.itemPrice = String(price);
    card.dataset.itemId = `product-${index}`;
    const cartLink = $('.product-icons a:first-child', card);
    cartLink?.addEventListener('click', event => {
      event.preventDefault();
      addToCart({ id: card.dataset.itemId, name, price, image });
    });
    $('.item-detail-button', card)?.addEventListener('click', event => {
      event.preventDefault();
      openProductModal({ id: card.dataset.itemId, name, price, image, description: `Nikmati ${name} pilihan Kenangan Senja. Harga: ${rupiah(price)}.` });
    });
  });

  function addToCart(item) {
    if (!item.price || item.price < 1) {
      toast('Harga item belum valid. Periksa harga di halaman.');
      return;
    }
    const existing = cart.get(item.id);
    cart.set(item.id, { ...item, qty: existing ? existing.qty + 1 : 1 });
    saveCart();
    renderCart();
    toast(`${item.name} ditambahkan ke keranjang.`);
  }
  function saveCart() {
    try { localStorage.setItem('kenanganSenjaCart', JSON.stringify([...cart.values()])); } catch (_) {}
  }
  function renderCart() {
    const container = $('#cart-items');
    const entries = [...cart.values()];
    container.innerHTML = '';
    if (!entries.length) {
      container.innerHTML = '<p class="cart-empty">Keranjang masih kosong. Pilih menu favoritmu dulu!</p>';
    }
    entries.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      const img = document.createElement('img');
      img.src = item.image; img.alt = item.name;
      const detail = document.createElement('div'); detail.className = 'item-detail';
      const title = document.createElement('h3'); title.textContent = item.name;
      const price = document.createElement('div'); price.className = 'item-price'; price.textContent = `${rupiah(item.price)} × ${item.qty}`;
      const controls = document.createElement('div'); controls.className = 'qty-controls';
      const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Kurangi ${item.name}`);
      const qty = document.createElement('span'); qty.textContent = item.qty;
      const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Tambah ${item.name}`);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-item'; remove.textContent = 'Hapus';
      minus.addEventListener('click', () => changeQty(item.id, -1));
      plus.addEventListener('click', () => changeQty(item.id, 1));
      remove.addEventListener('click', () => { cart.delete(item.id); saveCart(); renderCart(); toast(`${item.name} dihapus.`); });
      controls.append(minus, qty, plus);
      detail.append(title, price, controls);
      row.append(img, detail, remove);
      container.append(row);
    });
    const total = entries.reduce((sum, item) => sum + item.price * item.qty, 0);
    $('#cart-total').textContent = rupiah(total);
    $('#checkout-button').disabled = entries.length === 0;
    $('#shopping-cart-button')?.setAttribute('aria-label', `Keranjang belanja, ${entries.reduce((s, i) => s + i.qty, 0)} item`);
  }
  function changeQty(id, amount) {
    const item = cart.get(id);
    if (!item) return;
    item.qty += amount;
    if (item.qty <= 0) cart.delete(id);
    saveCart(); renderCart();
  }
  $('#clear-cart')?.addEventListener('click', () => {
    if (!cart.size) return toast('Keranjang sudah kosong.');
    cart.clear(); saveCart(); renderCart(); toast('Keranjang dikosongkan.');
  });
  $('#checkout-button')?.addEventListener('click', () => {
    const items = [...cart.values()];
    if (!items.length) return;
    const number = prompt('Masukkan nomor WhatsApp kedai (format internasional, contoh 62812xxxx tanpa tanda +):');
    if (!number) return;
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 9 || cleanNumber.length > 15) return toast('Nomor WhatsApp tidak valid.');
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const lines = items.map(item => `• ${item.name} x${item.qty} — ${rupiah(item.price * item.qty)}`).join('\n');
    const message = `Halo Kenangan Senja, saya ingin memesan:\n${lines}\n\nTotal: ${rupiah(total)}\nMohon konfirmasi pesanan saya.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  });

  // Detail produk menggunakan data kartu yang dipilih
  const modal = $('#item-detail-modal');
  function openProductModal(item) {
    const img = $('.modal-content > img', modal);
    const content = $('.modal-content .product-content', modal);
    img.src = item.image; img.alt = item.name;
    content.querySelector('h3').textContent = item.name;
    content.querySelector('p').textContent = item.description;
    const oldPrice = $('.product-price span', content);
    if (oldPrice) oldPrice.remove();
    $('.product-price', content).childNodes[0].textContent = `${rupiah(item.price)} `;
    const addButton = $('.product-content > a', content);
    addButton.innerHTML = '<i data-feather="shopping-cart"></i><span>Tambah ke keranjang</span>';
    addButton.onclick = event => { event.preventDefault(); addToCart(item); modal.style.display = 'none'; };
    if (window.feather) feather.replace();
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
  // Menu juga dapat membuka detail melalui gambar
  menuCards.forEach(card => {
    $('img', card)?.addEventListener('click', () => openProductModal({
      id: card.dataset.itemId, name: card.dataset.itemName, price: Number(card.dataset.itemPrice),
      image: $('img', card).getAttribute('src'), description: `Sajian ${card.dataset.itemName} dari Kenangan Senja.`
    }));
    $('img', card)?.setAttribute('tabindex', '0');
    $('img', card)?.setAttribute('role', 'button');
    $('img', card)?.setAttribute('aria-label', `Lihat detail ${card.dataset.itemName}`);
  });
  function closeModal() {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  $('.modal .close-icon')?.addEventListener('click', event => { event.preventDefault(); closeModal(); });
  modal?.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      navbarNav?.classList.remove('active');
      searchForm?.classList.remove('active');
      cartPanel?.classList.remove('active');
    }
  });

  // Tutup panel ketika klik di luar
  document.addEventListener('click', event => {
    if (hamburger && navbarNav && !hamburger.contains(event.target) && !navbarNav.contains(event.target)) navbarNav.classList.remove('active');
    if (searchButton && searchForm && !searchButton.contains(event.target) && !searchForm.contains(event.target)) searchForm.classList.remove('active');
    const cartButton = $('#shopping-cart-button');
    if (cartButton && cartPanel && !cartButton.contains(event.target) && !cartPanel.contains(event.target)) cartPanel.classList.remove('active');
  });

  // Form kontak: validasi, lalu siapkan email (atur alamat tujuan di bawah).
  const CONTACT_EMAIL = ''; // Isi alamat email kedai, contoh: kedai@example.com
  $('#contact-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('nama') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('telepon') || '').trim();
    const message = String(data.get('pesan') || '').trim();
    if (!CONTACT_EMAIL) {
      toast('Form valid! Atur CONTACT_EMAIL di script.js agar pesan bisa dikirim.');
      alert(`Pesan siap dikirim:\nNama: ${name}\nEmail: ${email}\nTelepon: ${phone || '-'}\nPesan: ${message}\n\nAtur CONTACT_EMAIL di script.js untuk membuka aplikasi email otomatis.`);
      return;
    }
    const subject = encodeURIComponent(`Pesan website dari ${name}`);
    const body = encodeURIComponent(`Nama: ${name}\nEmail: ${email}\nTelepon: ${phone || '-'}\n\nPesan:\n${message}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    toast('Membuka aplikasi email…');
  });

  renderCart();
})();
