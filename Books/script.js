const proxyUrl = "https://thingproxy.freeboard.io/fetch/";
const feedUrl = "https://www.goodreads.com/review/list_rss/82726216?shelf=read";

fetch(proxyUrl + encodeURIComponent(feedUrl))
  .then(response => response.text())
  .then(xmlString => {
    console.log("Fetched data:", xmlString);
    document.getElementById("book-list").innerText = "Data loaded!";
  })
  .catch(err => {
    console.error("Fetch failed:", err);
    document.getElementById("book-list").innerText = "Fetch failed.";
  });
