const proxyUrl = "https://api.allorigins.win/get?url=";
const feedUrl = "https://www.goodreads.com/review/list_rss/82726216?shelf=read";

fetch(proxyUrl + encodeURIComponent(feedUrl))
  .then(response => response.json())
  .then(data => {
    console.log("Fetched data:", data.contents);
    document.getElementById("book-list").innerText = data.contents ? "Data loaded!" : "No content found.";
  })
  .catch(err => {
    console.error("Fetch failed:", err);
    document.getElementById("book-list").innerText = "Fetch failed.";
  });
