let contacts = [];

const extractBtn = document.getElementById("extractBtn");
const downloadBtn = document.getElementById("downloadBtn");
const counter = document.getElementById("counter");
const status = document.getElementById("status");

extractBtn.addEventListener("click", async () => {
  status.textContent = "Reading visible contacts...";
  extractBtn.disabled = true;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || !tab.url || !tab.url.startsWith("https://web.whatsapp.com/")) {
      throw new Error("Please open WhatsApp Web first.");
    }

    const response = await chrome.tabs.sendMessage(
      tab.id,
      { type: "EXTRACT_VISIBLE_CONTACTS" }
    );

    contacts = response?.contacts || [];

    counter.textContent =
      `${contacts.length} Contact${contacts.length === 1 ? "" : "s"}`;

    downloadBtn.disabled = contacts.length === 0;

    if (contacts.length > 0) {
      status.textContent =
        "Contacts ready. Click Download CSV.";
    } else {
      status.textContent =
        "No visible contacts found. Open the group participant list and try again.";
    }

  } catch (error) {
    status.textContent =
      error.message || "Something went wrong.";
  }

  extractBtn.disabled = false;
});


downloadBtn.addEventListener("click", () => {

  if (contacts.length === 0) {
    return;
  }

  const headers = [
    "Name",
    "Phone Number",
    "Formatted Phone",
    "Source"
  ];

  const rows = contacts.map(contact => [
    contact.name,
    contact.phone,
    contact.formattedPhone,
    "WhatsApp Web"
  ]);

  const csv = [
    headers,
    ...rows
  ]
  .map(row =>
    row.map(value => csvEscape(value)).join(",")
  )
  .join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download =
    `whatsapp_contacts_${getDate()}.csv`;

  link.click();

  URL.revokeObjectURL(url);

  status.textContent = "CSV downloaded successfully!";
});


function csvEscape(value) {

  const text = String(value ?? "");

  return `"${text.replace(/"/g, '""')}"`;
}


function getDate() {

  const date = new Date();

  return date.toISOString().slice(0, 10);
}
