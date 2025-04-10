const proxyUrl = "https://api.allorigins.win/get?url=";
const userId = "82726216";

const shelfUrls = {
  "read": `https://www.goodreads.com/review/list_rss/${userId}?shelf=read`,
  "currently-reading": `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading`,
  "to-read": `https://www.goodreads.com/review/list_rss/${userId}?shelf=to-read`,
};

const bookList = document.getElementById("book-list");
const buttons = document.querySelectorAll("#filter-buttons button");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const shelf = button.getAttribute("data-shelf");
    loadShelf(shelf);
  });
});

function loadShelf(shelf) {
  bookList.innerHTML = "Loading...";
  const url = proxyUrl + encodeURIComponent(shelfUrls[shelf]);

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, "text/xml");
      const items = xml.querySelectorAll("item");
      bookList.innerHTML = "";

      items.forEach(item => {
        const title = item.querySelector("title").textContent;
        const author = item.querySelector("author_name").textContent;
        const image = item.querySelector("book_large_image_url").textContent;

        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
          <img src="${image}" alt="${title}" />
          <div class="book-title">${title}</div>
          <div class="book-author">${author}</div>
        `;
        bookList.appendChild(card);
      });
    })
    .catch(err => {
      bookList.innerHTML = "Failed to load books.";
      console.error(err);
    });
}

// Load default shelf on page load
loadShelf("read");
