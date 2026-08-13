const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const videos = [
  {
    id: 1,
    title: "Trending Video 01",
    category: "Trending",
    emoji: "🔥"
  },
  {
    id: 2,
    title: "Funny Video 02",
    category: "Funny",
    emoji: "😂"
  },
  {
    id: 3,
    title: "Popular Video 03",
    category: "Popular",
    emoji: "⭐"
  },
  {
    id: 4,
    title: "Trending Video 04",
    category: "Trending",
    emoji: "🎬"
  },
  {
    id: 5,
    title: "Funny Video 05",
    category: "Funny",
    emoji: "🤣"
  },
  {
    id: 6,
    title: "Popular Video 06",
    category: "Popular",
    emoji: "💥"
  }
];

let selected = null;

const grid = document.getElementById("videoGrid");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const preview = document.getElementById("preview");
const closeModal = document.getElementById("closeModal");
const videoBtn = document.getElementById("videoBtn");

const user = tg?.initDataUnsafe?.user;

if (user) {
  document.getElementById("tgUser").textContent =
    user.first_name || "Telegram User";
}

function render(category = "All") {
  grid.innerHTML = "";

  const filteredVideos = videos.filter(
    video =>
      category === "All" ||
      video.category === category
  );

  filteredVideos.forEach(video => {
    const card = document.createElement("article");

    card.className = "card";

    card.innerHTML = `
      <div class="thumb">${video.emoji}</div>

      <div class="card-body">
        <h3>${video.title}</h3>

        <div class="meta">
          ${video.category}
        </div>

        <button class="open-btn">
          Open
        </button>
      </div>
    `;

    card
      .querySelector(".open-btn")
      .addEventListener("click", () => {
        openVideo(video);
      });

    grid.appendChild(card);
  });
}

function openVideo(video) {
  selected = video;

  modalTitle.textContent = video.title;
  modalText.textContent =
    "Video content will be available here.";

  preview.textContent = video.emoji;

  modal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", event => {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

videoBtn.addEventListener("click", () => {
  if (!selected) return;

  alert(
    "Video URL/backend এখানে যোগ করতে হবে।"
  );
});

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {

    document
      .querySelectorAll(".tab")
      .forEach(tab => {
        tab.classList.remove("active");
      });

    button.classList.add("active");

    render(button.dataset.category);
  });
});

render();
