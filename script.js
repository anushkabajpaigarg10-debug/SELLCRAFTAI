
const $ = id => document.getElementById(id);

const outputFields = {
  title: "outTitle",
  description: "outDescription",
  features: "outFeatures",
  keywords: "outKeywords",
  caption: "outCaption",
  missing: "outMissing"
};

const STORAGE_KEY = "sellcraftDrafts";

function getProduct() {
  return {
    name: $("productName").value.trim(),
    category: $("category").value.trim() || "General",
    audience: $("audience").value.trim() || "customers",
    details: $("details").value.trim(),
    tone: $("tone").value,
    platform: $("platform").value,
    language: $("language").value
  };
}

function generateListing(product) {
  const { name, category, audience, details, tone, platform } = product;

  let opening = `Discover ${name}, thoughtfully suited to ${audience}.`;

  if (tone === "Professional") {
    opening = `${name} is designed for customers looking for practical products.`;
  } else if (tone === "Playful") {
    opening = `A little something to brighten your day: ${name}!`;
  } else if (tone === "Minimal") {
    opening = `${name}. Simple, useful, and easy to make your own.`;
  } else if (tone === "Premium") {
    opening = `Meet ${name}, a considered choice for those who appreciate thoughtful details.`;
  }

  const featureList = details
    .split(/[\n.;]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "are",
    "has", "have", "your", "you", "from", "its", "can"
  ]);

  const keywords = [...new Set(
    (name + " " + category + " " + details)
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter(word => word.length > 2 && !stopWords.has(word)) || []
  )].slice(0, 12);

  let caption;

  if (platform === "Instagram") {
    caption = `${name} ✨\n${details}\n\nSave this for later and message us with questions.\n#${category.replace(/[^a-z0-9]/gi, "")} #ShopSmall`;
  } else if (platform === "WhatsApp") {
    caption = `New: ${name}\n${details}\n\nInterested? Message us for more details.`;
  } else {
    caption = `${name}\n${details}\n\nContact us for more product information.`;
  }

  const missing = [];

  if (!/\b(price|₹|rs\.?|\$|€)\s*\d/i.test(details)) {
    missing.push("Price and currency");
  }

  if (!/\b(cm|mm|inch|inches|kg|ml|dimensions?|a[0-9])\b/i.test(details)) {
    missing.push("Exact size or dimensions, if relevant");
  }

  if (!/\b(material|cotton|leather|steel|wood|plastic|paper|fabric|ingredients?)\b/i.test(details)) {
    missing.push("Material or ingredients, if relevant");
  }

  if (!/\b(colou?r|pink|blue|black|white|green|red|cream)\b/i.test(details)) {
    missing.push("Available colours, if relevant");
  }

  return {
    title: name,
    description: `${opening}\n\n${details}\n\nReview the product details and contact the seller if you need more information.`,
    features: featureList.map(item => "• " + item).join("\n"),
    keywords: keywords.join(", "),
    caption,
    missing: missing.length
      ? missing.join("\n")
      : "No obvious missing details detected. Verify all claims before publishing."
  };
}

function readOutputs() {
  return Object.fromEntries(
    Object.entries(outputFields).map(([key, id]) => [key, $(id).value])
  );
}

function fillOutputs(listing) {
  Object.entries(outputFields).forEach(([key, id]) => {
    $(id).value = listing[key] || "";
  });
}

function setStatus(id, message, error = false) {
  $(id).textContent = message;
  $(id).style.color = error ? "#c0394b" : "";
}

$("productForm").addEventListener("submit", event => {
  event.preventDefault();

  const product = getProduct();

  if (!product.name || !product.details) {
    setStatus("formStatus", "Please fill in the required fields.", true);
    return;
  }

  fillOutputs(generateListing(product));

  setStatus(
    "formStatus",
    "Listing generated! Review and edit it before publishing."
  );

  setStatus(
    "resultStatus",
    "Your listing is ready."
  );
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

document.querySelectorAll(".result-heading button").forEach(button => {
  button.addEventListener("click", () => {});
});

$("copyAll").addEventListener("click", async () => {
  const text = Object.entries(readOutputs())
    .map(([key, value]) => `${key.toUpperCase()}\n${value}`)
    .join("\n\n");

  await copyText(text);
  setStatus("resultStatus", "All listing content copied.");
});

$("downloadBtn").addEventListener("click", () => {
  const text = Object.entries(readOutputs())
    .map(([key, value]) => `${key.toUpperCase()}\n${value}`)
    .join("\n\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "sellcraft-listing.txt";
  link.click();

  URL.revokeObjectURL(url);
  setStatus("resultStatus", "Listing downloaded.");
});

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderDrafts() {
  const list = $("savedList");
  const drafts = getDrafts();

  list.replaceChildren();

  if (!drafts.length) {
    list.textContent = "No drafts saved yet.";
    return;
  }

  drafts.forEach((draft, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";

    const name = document.createElement("span");
    name.textContent = draft.name;

    const load = document.createElement("button");
    load.className = "secondary";
    load.textContent = "Load";

    load.addEventListener("click", () => {
      fillOutputs(draft.listing);
      setStatus("resultStatus", "Draft loaded.");
    });

    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      const updated = getDrafts().filter((_, i) => i !== index);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      renderDrafts();
    });

    row.append(name, load, remove);
    list.appendChild(row);
  });
}

$("saveBtn").addEventListener("click", () => {
  const listing = readOutputs();

  if (!listing.title.trim() && !listing.description.trim()) {
    setStatus("resultStatus", "Generate a listing before saving.", true);
    return;
  }

  const drafts = getDrafts();

  drafts.unshift({
    name: listing.title || "Untitled listing",
    listing,
    savedAt: new Date().toISOString()
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts.slice(0, 30)));
    renderDrafts();
    setStatus("resultStatus", "Draft saved in your browser.");
  } catch {
    setStatus("resultStatus", "Could not save the draft.", true);
  }
});

$("newBtn").addEventListener("click", () => {
  $("productForm").reset();

  Object.values(outputFields).forEach(id => {
    $(id).value = "";
  });

  setStatus("formStatus", "Enter details for your next product.");
  setStatus("resultStatus", "Started a new listing.");
});

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

renderDrafts();
