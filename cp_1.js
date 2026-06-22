document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedback-form");
  const display = document.getElementById("feedback-display");
  const tooltip = document.getElementById("tooltip");
  const commentsField = form.elements.comments;
  const charCountEl = document.getElementById("char-count");
  const charCountWrap = charCountEl.parentElement;
  const maxCommentLength = Number(commentsField.maxLength) || 300;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let tooltipSize = { width: 0, height: 0 };
  let pendingMove = null;

  const validators = {
    name: (value) => (value ? "" : "Please enter your name."),
    email: (value) => {
      if (!value) return "Please enter your email.";
      return emailPattern.test(value) ? "" : "Please enter a valid email address.";
    },
    comments: (value) => (value ? "" : "Please leave a comment."),
  };

  addGooeyBlobs();
  updateCharacterCount(0);

  form.addEventListener("input", ({ target }) => {
    if (!isFormField(target)) return;

    clearError(target.name);

    if (target === commentsField) {
      updateCharacterCount(target.value.length);
    }
  });

  form.addEventListener("mouseover", ({ target }) => {
    const field = target.closest("[data-tooltip]");
    if (!field) return;
    showTooltip(field.dataset.tooltip);
  });

  form.addEventListener("mouseout", ({ target }) => {
    if (target.closest("[data-tooltip]")) {
      hideTooltip();
    }
  });

  form.addEventListener("mousemove", ({ clientX, clientY }) => {
    if (tooltip.classList.contains("show")) {
      positionTooltip(clientX, clientY);
    }
  });

  form.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", hideTooltip);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values = getFormValues();
    const errors = validate(values);

    clearAllErrors();
    renderErrors(errors);

    if (Object.keys(errors).length > 0) return;

    appendFeedback(values);
    form.reset();
    updateCharacterCount(0);
    hideTooltip();
  });

  function addGooeyBlobs() {
    form.querySelectorAll(".gooey-input").forEach((wrapper) => {
      const blobs = document.createElement("span");
      blobs.className = "gooey-input__blobs";
      blobs.setAttribute("aria-hidden", "true");
      wrapper.appendChild(blobs);
    });
  }

  function updateCharacterCount(length) {
    charCountEl.textContent = String(length);
    charCountWrap.classList.toggle(
      "limit-near",
      length >= maxCommentLength * 0.8 && length < maxCommentLength
    );
    charCountWrap.classList.toggle("limit-reached", length >= maxCommentLength);
  }

  function getFormValues() {
    return {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      comments: commentsField.value.trim(),
    };
  }

  function validate(values) {
    return Object.entries(validators).reduce((errors, [fieldName, validator]) => {
      const message = validator(values[fieldName]);

      if (message) {
        errors[fieldName] = message;
      }

      return errors;
    }, {});
  }

  function renderErrors(errors) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      form.elements[fieldName].classList.add("invalid");

      const errorEl = getErrorEl(fieldName);
      if (!errorEl) return;

      errorEl.textContent = message;
      errorEl.classList.add("show");
    });
  }

  function clearError(fieldName) {
    const field = form.elements[fieldName];
    if (!field) return;

    field.classList.remove("invalid");

    const errorEl = getErrorEl(fieldName);
    if (!errorEl) return;

    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }

  function clearAllErrors() {
    Object.keys(validators).forEach(clearError);
  }

  function getErrorEl(fieldName) {
    return form.querySelector(`[data-error-for="${fieldName}"]`);
  }

  function showTooltip(text) {
    tooltip.textContent = text;
    tooltip.classList.add("show");
    tooltip.setAttribute("aria-hidden", "false");

    const rect = tooltip.getBoundingClientRect();
    tooltipSize = { width: rect.width, height: rect.height };
  }

  function hideTooltip() {
    tooltip.classList.remove("show");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function positionTooltip(x, y) {
    if (pendingMove) cancelAnimationFrame(pendingMove);

    pendingMove = requestAnimationFrame(() => {
      const pad = 14;
      let left = x + pad;
      let top = y + pad;

      if (left + tooltipSize.width > window.innerWidth) {
        left = x - tooltipSize.width - pad;
      }

      if (top + tooltipSize.height > window.innerHeight) {
        top = y - tooltipSize.height - pad;
      }

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      pendingMove = null;
    });
  }

  function appendFeedback({ name, email, comments }) {
    display.querySelector(".empty-state")?.remove();

    const nameEl = createElement("span", "feedback-entry__name", name);
    const emailEl = createElement("span", "feedback-entry__email", email);
    const timeEl = createElement("span", "feedback-entry__time", formatTime());
    const commentEl = createElement("p", "feedback-entry__comment", comments);
    const left = document.createElement("div");
    const top = document.createElement("div");
    const entry = document.createElement("div");

    left.append(nameEl, document.createTextNode(" "), emailEl);

    top.className = "feedback-entry__top";
    top.append(left, timeEl);

    entry.className = "feedback-entry";
    entry.append(top, commentEl);

    display.prepend(entry);
  }

  function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function formatTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isFormField(target) {
    return target instanceof HTMLElement && target.matches("input, textarea");
  }
});
