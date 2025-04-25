const bookList = document.getElementById("book-list");
const buttons = document.querySelectorAll("#filter-buttons button");

// Load books.json
let allBooks = [];

fetch("books.json")
  .then(res => res.json())
  .then(data => {
    allBooks = data;
    loadShelf("read"); // Load default shelf
  });

// Filter buttons
buttons.forEach(button => {
  button.addEventListener("click", () => {
    const shelf = button.getAttribute("data-shelf");
    loadShelf(shelf);
  });
});

function loadShelf(shelf) {
  bookList.innerHTML = "Loading...";

  const booksInShelf = allBooks.filter(book => book.shelf === shelf);
  if (booksInShelf.length === 0) {
    bookList.innerHTML = "No books found.";
    return;
  }

  bookList.innerHTML = "";

  booksInShelf.forEach(book => {
    fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}`)
      .then(res => res.json())
      .then(data => {
        if (!data.docs || data.docs.length === 0) return;

        const result = data.docs[0];
        const title = result.title || book.title;
        const author = result.author_name ? result.author_name[0] : "Unknown Author";
        const coverId = result.cover_i;
        const coverUrl = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
          : "https://via.placeholder.com/150x220?text=No+Cover";

        const card = document.createElement("div");
        card.className = "book-card";
        card.innerHTML = `
          <img src="${coverUrl}" alt="${title}" />
          <div class="book-title">${title}</div>
          <div class="book-author">${author}</div>
        `;
        bookList.appendChild(card);
      })
      .catch(err => {
        console.error("Failed to fetch book data:", err);
      });
  });
}
