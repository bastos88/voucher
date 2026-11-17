"use strict";

// O produto principal escolhe a variante. Edite os dados sem alterar o componente.
const products = {
  "museu-adulto": { name: "Bilhete Museu Adulto", layoutKey: "single-fcp", supplierId: "mfcp" },
  "museu-crianca": { name: "Bilhete Museu Criança", layoutKey: "single-fcp", supplierId: "mfcp" },
  "museu-familia": { name: "Bilhete Museu Família", layoutKey: "single-fcp", supplierId: "mfcp" },
  "museu-grupo": { name: "Visita ao Museu FC Porto", layoutKey: "grupo-fcp", supplierId: "mfcp" },
  "museu-estadio-grupo": { name: "Visita ao Museu FC Porto + Estádio", layoutKey: "grupo-fcp", supplierId: "mfcp" },
  "passeio-barco": { name: "Passeio de barco no Douro", layoutKey: "generico", supplierId: "douro" },
  "cruzeiro-douro": {
    name: "Cruzeiro no Douro", layoutKey: "generico", supplierId: "douro",
    background: {
      image: "assets/douro-panoramico.jpg",
      bodyTone: "rgb(14 39 48 / 80%)",
      stubTone: "rgb(38 87 104 / 86%)"
    }
  },
  hotel: { name: "Estadia em hotel", layoutKey: "generico", supplierId: "outro" },
  restaurante: { name: "Reserva de restaurante", layoutKey: "generico", supplierId: "outro" }
};

// Substitua name e logo pelos elementos reais de cada fornecedor.
const suppliers = {
  mfcp: { name: "Museu FC Porto", logo: "assets/fc-porto.png" },
  douro: { name: "Douro Fluvial", logo: null },
  outro: { name: "Nome do fornecedor", logo: null }
};

const fcpBackground = {
  image: "assets/museu-estrela.webp",
  bodyTone: "rgb(12 29 75 / 86%)",
  stubTone: "rgb(43 94 210 / 90%)"
};

// Só os dados, os rótulos e o fundo variam. A geometria vem de styles.css.
const layouts = {
  "single-fcp": {
    label: "Single FCP", holderLabel: "Pessoa principal", dateLabel: "Data e hora da visita",
    referenceLabel: "Ref. MFCP", background: fcpBackground
  },
  "grupo-fcp": {
    label: "Grupo FCP", holderLabel: "Nome do grupo", dateLabel: "Data e hora da visita",
    referenceLabel: "Ref. MFCP", background: fcpBackground
  },
  generico: {
    label: "Genérico", holderLabel: "Cliente ou grupo", dateLabel: "Data e hora do serviço",
    referenceLabel: "Ref. do fornecedor",
    // Fundo neutro configurável, com dois tons da mesma cor.
    background: { image: null, bodyTone: "#293e40", stubTone: "#526f72" }
  }
};

const paymentTypes = {
  "pre-pago": "Pré-pago",
  "acordo-comercial": "Acordo comercial",
  "pagamento-balcao": "Pagamento ao balcão"
};

// Itens reservados e categorias de participantes são listas independentes.
const examples = {
  single: {
    productId: "museu-adulto", reservedOption: "Museu", holderName: "António Joaquim",
    reservedItems: [{ productId: "museu-adulto", quantity: 1 }],
    participants: [{ singular: "pessoa", plural: "pessoas", quantity: 1 }],
    date: "2026-11-21", time: "10:30", supplierReference: "MFCP-2026-00842",
    issueReference: "IS-2026-00128", paymentType: "pre-pago",
    qr: { src: "assets/qr-demonstracao.png", isDemo: true }
  },
  grupo: {
    productId: "museu-grupo", reservedOption: "Museu + Estádio", holderName: "Grupo do Quim",
    reservedItems: [
      { productId: "museu-adulto", quantity: 30 },
      { productId: "museu-crianca", quantity: 10 }
    ],
    participants: [
      { singular: "adulto", plural: "adultos", quantity: 30 },
      { singular: "criança", plural: "crianças", quantity: 10 }
    ],
    date: "2026-11-22", time: "14:00", supplierReference: "MFCP-GRP-00416",
    issueReference: "IS-2026-00129", paymentType: "acordo-comercial",
    qr: { src: "assets/qr-demonstracao.png", isDemo: true }
  },
  barco: {
    productId: "passeio-barco", reservedOption: "Cruzeiro das seis pontes · 50 minutos", holderName: "Grupo Silva",
    reservedItems: [{ productId: "passeio-barco", quantity: 12 }],
    participants: [{ singular: "adulto", plural: "adultos", quantity: 12 }],
    date: "2026-11-23", time: "15:30", supplierReference: "DF-2026-01953",
    issueReference: "IS-2026-00130", paymentType: "pagamento-balcao",
    qr: { src: "assets/qr-demonstracao.png", isDemo: true }
  },
  douro: {
    productId: "cruzeiro-douro", reservedOption: "Passeio panorâmico", holderName: "Grupo Almeida",
    reservedItems: [{ productId: "cruzeiro-douro", quantity: 12 }],
    participants: [{ singular: "adulto", plural: "adultos", quantity: 12 }],
    date: "2026-11-24", time: "11:00", supplierReference: "DF-2026-01954",
    issueReference: "IS-2026-00131", paymentType: "pre-pago",
    qr: { src: "assets/qr-demonstracao.png", isDemo: true }
  }
};

const container = document.querySelector("#voucher-container");
const selector = document.querySelector("#example-select");
const printButton = document.querySelector("#print-button");
const status = document.querySelector("#preview-status");

function participantSummary(participants) {
  const total = participants.reduce((sum, category) => sum + category.quantity, 0);
  const categories = participants
    .filter(category => category.quantity > 0)
    .map(category => `${category.quantity} ${category.quantity === 1 ? category.singular : category.plural}`);
  return { total: `${total} ${total === 1 ? "pessoa" : "pessoas"}`, categories: categories.join(" · ") };
}

// Devolve o componente partilhado pela emissão e pela pré-visualização.
function createVoucher(reservation, idPrefix = "voucher") {
  const product = products[reservation.productId];
  if (!product || !layouts[product.layoutKey]) throw new Error("Configure um produto com layoutKey válido.");
  const layout = layouts[product.layoutKey];
  const supplier = suppliers[product.supplierId];
  const payment = paymentTypes[reservation.paymentType];
  if (!supplier || !payment || !reservation.qr?.src) {
    throw new Error("Preencha o fornecedor, o tipo de pagamento e a imagem do QR da emissão.");
  }
  const voucher = document.querySelector("#voucher-template").content.firstElementChild.cloneNode(true);
  voucher.dataset.layoutKey = product.layoutKey;
  const title = voucher.querySelector(".product-name");
  title.id = `${idPrefix}-title`;
  voucher.setAttribute("aria-labelledby", title.id);
  const summary = participantSummary(reservation.participants);
  const [year, month, day] = reservation.date.split("-").map(Number);
  const date = new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(year, month - 1, day));
  const fields = {
    "product-name": product.name, "reserved-option": reservation.reservedOption,
    "holder-label": layout.holderLabel, "holder-name": reservation.holderName,
    "participant-total": product.layoutKey === "single-fcp" && summary.total === "1 pessoa" ? "1 Pessoa" : summary.total,
    "participant-categories": product.layoutKey === "single-fcp" ? "" : summary.categories,
    "date-label": layout.dateLabel, date, time: reservation.time,
    "reference-label": layout.referenceLabel, "supplier-reference": reservation.supplierReference,
    payment, "supplier-wordmark": supplier.name,
    "qr-caption": reservation.qr.isDemo ? "QR de demonstração" : "QR da reserva",
    "issue-reference": reservation.issueReference
  };
  for (const [name, value] of Object.entries(fields)) {
    voucher.querySelector(`[data-field="${name}"]`).textContent = value;
  }
  voucher.querySelector("time").dateTime = `${reservation.date}T${reservation.time}`;

  const background = product.background || layout.background;
  voucher.style.setProperty("--body-tone", background.bodyTone);
  voucher.style.setProperty("--stub-tone", background.stubTone);
  const photo = voucher.querySelector('[data-image="background"]');
  photo.hidden = !background.image;
  if (background.image) photo.src = background.image;

  const logo = voucher.querySelector('[data-image="supplier-logo"]');
  logo.hidden = !supplier.logo;
  if (supplier.logo) {
    logo.src = supplier.logo;
    logo.alt = supplier.name;
  }
  voucher.querySelector('[data-field="supplier-wordmark"]').hidden = Boolean(supplier.logo);
  const qr = voucher.querySelector('[data-image="qr"]');
  qr.src = reservation.qr.src;
  qr.alt = reservation.qr.isDemo ? "QR de demonstração" : `QR da reserva ${reservation.issueReference}`;

  const list = voucher.querySelector('[data-list="items"]');
  for (const item of reservation.reservedItems) {
    const itemProduct = products[item.productId];
    if (!itemProduct) throw new Error(`Produto reservado desconhecido: ${item.productId}`);
    const row = document.createElement("li");
    const quantity = document.createElement("span");
    quantity.className = "item-quantity";
    quantity.textContent = `${item.quantity} ×`;
    const name = document.createElement("span");
    name.textContent = itemProduct.name;
    row.append(quantity, name);
    list.append(row);
  }
  return voucher;
}

async function prepareVoucher(voucher) {
  await document.fonts.ready;
  await Promise.all(Array.from(voucher.querySelectorAll("img:not([hidden])"), image => image.decode()));
  voucher.classList.remove("voucher--dense");
  const title = voucher.querySelector(".product-name");
  title.style.removeProperty("font-size");
  const titleStyle = getComputedStyle(title);
  const titleLineHeight = parseFloat(titleStyle.lineHeight);
  let titleSize = parseFloat(titleStyle.fontSize);
  // O mesmo ajuste serve às três variantes. O bloco e a entrelinha são fixos.
  while (title.getBoundingClientRect().height > titleLineHeight * 2 + 1 && titleSize > 44) {
    titleSize -= 2;
    title.style.fontSize = `${titleSize}px`;
  }
  if (title.getBoundingClientRect().height > titleLineHeight * 2 + 1) {
    throw new Error("O título excede duas linhas. Ajuste o nome do produto antes de imprimir.");
  }
  const items = voucher.querySelector(".items-list");
  items.classList.remove("items-list--compact");
  const reservationMain = voucher.querySelector(".reservation-main");
  if (reservationMain.scrollHeight > reservationMain.clientHeight + 1) {
    voucher.classList.add("voucher--dense");
  }
  if (items.getBoundingClientRect().height > items.parentElement.clientHeight) {
    items.classList.add("items-list--compact");
  }
  const overflow = Array.from(voucher.querySelectorAll("[data-region]"))
    .find(region => region.scrollHeight > region.clientHeight + 1 || region.scrollWidth > region.clientWidth + 1);
  if (overflow) throw new Error(`O texto de «${overflow.dataset.region}» excede o espaço do bilhete. Ajuste o conteúdo antes de imprimir.`);
}

function renderVoucher(reservation) {
  const voucher = createVoucher(reservation, "preview");
  container.replaceChildren(voucher);
  const layout = layouts[products[reservation.productId].layoutKey];
  if (status) {
    status.textContent = `${layout.label} · ${reservation.holderName} · ${participantSummary(reservation.participants).total}`;
  }
  document.title = `Voucher ${reservation.issueReference} | Iberia Selection`;
  return voucher;
}

async function showSelectedExample() {
  printButton.disabled = true;
  try {
    const voucher = renderVoucher(examples[selector.value]);
    await prepareVoucher(voucher);
    if (voucher.isConnected) printButton.disabled = false;
  } catch (error) {
    if (status) status.textContent = error.message;
  }
}

selector.addEventListener("change", showSelectedExample);
printButton.addEventListener("click", async () => {
  printButton.disabled = true;
  selector.disabled = true;
  try {
    await prepareVoucher(container.querySelector(".voucher"));
    window.print();
  } catch (error) {
    if (status) status.textContent = error.message;
  } finally {
    selector.disabled = false;
    printButton.disabled = false;
  }
});

showSelectedExample();
