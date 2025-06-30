import {
  enableValidation,
  settings,
  disableButton,
  resetValidation,
} from "../scripts/validation.js";
import "./index.css";
import logo from "../images/logo.svg";
import avatarFallback from "../images/avatar.jpg";
import pencil from "../images/pencil.svg";
import plus from "../images/plus.svg";
import Api from "../utils/Api.js";
import {
  setButtonText,
  renderLoading,
  handleSubmit,
} from "../utils/helpers.js";

let currentUserId = null;
let selectedCard = null;
let selectedCardId = null;

const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");
const avatarImg = document.querySelector(".profile__avatar");
const cardsList = document.querySelector(".cards__list");

document.querySelector(".profile__edit-btn img").src = pencil;
document.querySelector(".profile__add-btn img").src = plus;
document.querySelector(".profile__avatar-btn img").src = pencil;
document.querySelector(".header__logo").src = logo;

const profileEditButton = document.querySelector(".profile__edit-btn");
const cardModalBtn = document.querySelector(".profile__add-btn");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");

const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);

const cardModal = document.querySelector("#add-card-modal");
const cardFormElement = cardModal.querySelector(".modal__form");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

const avatarModal = document.querySelector("#avatar-modal");
const avatarFormElement = document.querySelector("#edit-avatar-form");
const avatarInput = avatarModal.querySelector("#profile-avatar-input");
const avatarSubmitBtn = avatarModal.querySelector(".modal__submit-btn");

const deleteModal = document.querySelector("#delete-modal");
const deleteForm = deleteModal.querySelector("#delete-form");

const previewModal = document.querySelector("#preview-modal");
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaptionEl = previewModal.querySelector(".modal__caption");

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "80b1bd16-49fa-4449-b475-32eddc0cc8f2",
    "Content-Type": "application/json",
  },
});

// ---------- CARDS ----------
function getCardElement(data) {
  const cardTemplate = document
    .querySelector("#card-template")
    .content.querySelector(".card")
    .cloneNode(true);

  const cardImage = cardTemplate.querySelector(".card__image");
  const cardTitle = cardTemplate.querySelector(".card__title");
  const cardLikeBtn = cardTemplate.querySelector(".card__like-btn");
  const cardDeleteBtn = cardTemplate.querySelector(".card__delete-btn");

  cardImage.src = data.link;
  cardImage.alt = data.name;
  cardTitle.textContent = data.name;

  cardImage.addEventListener("click", () => openPreviewModal(data));

  cardLikeBtn.addEventListener("click", (evt) => {
    handleLike(evt, data._id);
  });

  cardDeleteBtn.addEventListener("click", () => {
    selectedCard = cardTemplate;
    selectedCardId = data._id;
    openModal(deleteModal);
  });

  if (data.isLiked) {
    cardLikeBtn.classList.add("card__like-btn_liked");
  }

  return cardTemplate;
}

function renderCard(data, method = "prepend") {
  const cardElement = getCardElement(data);
  cardsList[method](cardElement);
}

// ---------- HANDLERS ----------
function handleEditFormSubmit(evt) {
  function makeRequest() {
    return api
      .editUserInfo({
        name: editModalNameInput.value,
        about: editModalDescriptionInput.value,
      })
      .then((data) => {
        profileName.textContent = data.name;
        profileDescription.textContent = data.about;
        closeModal(editModal);
      });
  }

  handleSubmit(makeRequest, evt, "Saving...");
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true);

  const name = cardNameInput.value.trim();
  const link = cardLinkInput.value.trim();

  if (!name || !link) {
    setButtonText(submitBtn, false);
    return;
  }

  api
    .addCard({ name, link })
    .then((data) => {
      renderCard(data, "prepend");

      cardFormElement.reset();
      disableButton(submitBtn, settings);
      closeModal(cardModal);
    })
    .catch(console.error)
    .finally(() => setButtonText(submitBtn, false));
}

function handleDeleteCardSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true, "Yes", "Deleting...");
  if (!selectedCardId) return;

  api
    .deleteCard(selectedCardId)
    .then(() => {
      if (selectedCard) selectedCard.remove();
      selectedCard = null;
      selectedCardId = null;
      closeModal(deleteModal);
    })
    .catch(console.error)
    .finally(() => setButtonText(submitBtn, false, "Delete", "Deleting..."));
}

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true);
  api
    .editAvatarInfo(avatarInput.value)
    .then((data) => {
      avatarImg.src = data.avatar;
      avatarFormElement.reset();
      disableButton(submitBtn, settings);
      closeModal(avatarModal);
    })
    .catch(console.error)
    .finally(() => setButtonText(submitBtn, false));
}

function handleLike(evt, cardId) {
  const likeBtn = evt.currentTarget;
  const isLiked = likeBtn.classList.contains("card__like-btn_liked");
  api
    .changeLikeStatus(cardId, isLiked)
    .then(() => likeBtn.classList.toggle("card__like-btn_liked"))
    .catch(console.error);
}

// ---------- MODAL ----------
function openModal(modal) {
  modal.classList.add("modal_opened");
  document.addEventListener("keydown", handleEscape);
}
function closeModal(modal) {
  modal.classList.remove("modal_opened");
  document.removeEventListener("keydown", handleEscape);
}
function handleEscape(evt) {
  if (evt.key === "Escape") {
    const openedModal = document.querySelector(".modal_opened");
    if (openedModal) closeModal(openedModal);
  }
}
function openPreviewModal(data) {
  previewModalImageEl.src = data.link;
  previewModalImageEl.alt = data.name;
  previewModalCaptionEl.textContent = data.name;
  openModal(previewModal);
}

// ---------- INIT ----------
api
  .getAppInfo()
  .then(([userData, cards]) => {
    currentUserId = userData._id;
    avatarImg.src = avatarFallback;

    const testImg = new Image();
    testImg.onload = () => (avatarImg.src = userData.avatar);
    testImg.onerror = () =>
      console.warn("Avatar failed to load. Using fallback.");
    testImg.src = userData.avatar;

    profileName.textContent = userData.name;
    profileDescription.textContent = userData.about;

    cards.forEach((card) => renderCard(card, "append"));
  })
  .catch(console.error);

// ---------- EVENTS ----------
const deleteCancelBtn = deleteModal.querySelector(
  ".modal__submit-btn_type_cancel"
);

deleteCancelBtn.addEventListener("click", () => {
  closeModal(deleteModal);
});

profileEditButton.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(editFormElement, settings);
  openModal(editModal);
});
cardModalBtn.addEventListener("click", () => openModal(cardModal));
avatarModalBtn.addEventListener("click", () => openModal(avatarModal));

editFormElement.addEventListener("submit", handleEditFormSubmit);
cardFormElement.addEventListener("submit", handleAddCardSubmit);
avatarFormElement.addEventListener("submit", handleAvatarSubmit);
deleteForm.addEventListener("submit", handleDeleteCardSubmit);

document.querySelectorAll(".modal__close-btn").forEach((btn) => {
  const modal = btn.closest(".modal");
  btn.addEventListener("click", () => closeModal(modal));
});
[editModal, cardModal, previewModal, avatarModal, deleteModal].forEach(
  (modal) => {
    modal.addEventListener("mousedown", (evt) => {
      if (evt.target === modal) closeModal(modal);
    });
  }
);

enableValidation(settings);
