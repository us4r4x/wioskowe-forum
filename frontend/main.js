const API_URL = "http://localhost:8000";

// Elementy logowania
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("loginName");
const authorInput = document.getElementById("author");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const usernameDisplay = document.getElementById("usernameDisplay");

// Sprawdzenie czy użytkownik już zapisany
const savedName = localStorage.getItem("username");
if (savedName) {
  loginForm.style.display = "none";
  userInfo.classList.remove("hidden");
  authorInput.value = savedName;
  usernameDisplay.textContent = savedName;
}

// Obsługa logowania
loginBtn.addEventListener("click", () => {
  const name = loginInput.value.trim();
  if (name) {
    localStorage.setItem("username", name);
    loginForm.style.display = "none";
    userInfo.classList.remove("hidden");
    authorInput.value = name;
    usernameDisplay.textContent = name;
  }
});

// Wyloguj
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  location.reload();
});

// Formularz dodawania posta
const form = document.getElementById("postForm");
const postsList = document.getElementById("postsList");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const post = {
    title: document.getElementById("title").value,
    content: document.getElementById("content").value,
    author: document.getElementById("author").value,
  };

  await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(post),
  });

  form.reset();
  loadPosts();
});

// Ładowanie postów
async function loadPosts() {
  const res = await fetch(`${API_URL}/posts`);
  const posts = await res.json();

  postsList.innerHTML = "";
  posts.reverse().forEach((post) => {
    const postEl = document.createElement("div");
    postEl.className = "bg-gray-800 p-4 rounded mb-4";

    postEl.innerHTML = `
      <h3 class="text-lg font-bold">${post.title}</h3>
      <p class="text-sm text-gray-300 mb-1">Autor: ${post.author}</p>
      <p class="mb-2">${post.content}</p>
      <p class="text-xs text-gray-400 mb-2">ID posta: ${post.id}</p>
      <div class="mb-2">
        <h4 class="font-semibold mb-1">💬 Komentarze:</h4>
        ${renderNestedComments(post.comments, post.id)}
      </div>
      <form onsubmit="return addComment(event, ${post.id})" class="flex gap-2 mt-2">
        <input type="text" placeholder="Twój komentarz" class="flex-1 p-1 bg-gray-700 text-white rounded" id="comment-${post.id}" required />
        <button class="bg-gray-600 text-white px-2 py-1 rounded">Dodaj</button>
      </form>
    `;

    postsList.appendChild(postEl);
  });
}

// 🧩 Nowa funkcja: renderowanie komentarzy jako drzewo
function renderNestedComments(comments, postId, level = 0) {
  if (!comments || comments.length === 0) return "";

  return comments.map((c) => `
    <div style="margin-left: ${level * 20}px" class="mb-2">
      <strong>${c.author}</strong>: ${c.content}
      <form onsubmit="return replyComment(event, ${postId}, ${c.id})" class="flex gap-2 mt-1">
        <input type="text" placeholder="Odpowiedz..." class="flex-1 p-1 bg-gray-700 text-white rounded" id="reply-${c.id}" />
        <button class="bg-green-600 text-white px-2 py-1 rounded">Odpowiedz</button>
      </form>
      ${renderNestedComments(c.replies, postId, level + 1)}
    </div>
  `).join('');
}

// Dodanie komentarza (do posta)
async function addComment(event, postId) {
  event.preventDefault();
  const input = document.getElementById(`comment-${postId}`);
  const content = input.value.trim();
  const author = localStorage.getItem("username") || "anonim";

  if (!content) return;

  await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, author }),
  });

  input.value = "";
  loadPosts();
}

// Odpowiedź na komentarz
async function replyComment(event, postId, parentId) {
  event.preventDefault();
  const input = document.getElementById(`reply-${parentId}`);
  const content = input.value.trim();
  const author = localStorage.getItem("username") || "anonim";

  if (!content) return;

  await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, author, parent_id: parentId }),
  });

  input.value = "";
  loadPosts();
}

loadPosts();
