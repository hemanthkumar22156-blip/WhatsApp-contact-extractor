(() => {
  "use strict";

  function cleanPhone(text) {
    if (!text) return "";

    return text
      .replace(/[^\d+]/g, "")
      .replace(/(?!^)\+/g, "");
  }

  function formatPhone(phone) {
    if (!phone) return "";

    // Keep international + number format readable
    if (phone.startsWith("+")) {
      return phone;
    }

    return phone;
  }

  function extractVisibleContacts() {
    const contacts = [];
    const seen = new Set();

    // Read only currently visible page text
    const elements = document.querySelectorAll(
      '[role="dialog"] span, [role="dialog"] div'
    );

    elements.forEach((element) => {
      const text = (element.innerText || element.textContent || "").trim();

      if (!text) return;

      // Phone number pattern
      const matches = text.match(
        /(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){7,15}/g
      );

      if (!matches) return;

      matches.forEach((match) => {
        const phone = cleanPhone(match);

        // Basic validation
        const digits = phone.replace(/\D/g, "");

        if (digits.length < 8 || digits.length > 15) {
          return;
        }

        if (seen.has(phone)) {
          return;
        }

        seen.add(phone);

        contacts.push({
          name: "",
          phone: phone,
          formattedPhone: formatPhone(phone)
        });
      });
    });

    return contacts;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "EXTRACT_VISIBLE_CONTACTS") {
      return;
    }

    try {
      const contacts = extractVisibleContacts();

      sendResponse({
        success: true,
        contacts: contacts
      });
    } catch (error) {
      sendResponse({
        success: false,
        contacts: [],
        error: error.message
      });
    }

    return true;
  });

})();
