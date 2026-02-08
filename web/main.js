function init() {
  const btn = document.getElementById("ytOpen");
  const visit = document.getElementById("visitTime");
  const now = new Date();
  if (visit) {
    visit.textContent = now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (btn) {
    btn.addEventListener("click", () => {
      window.open("https://www.naver.com/", "_blank", "noopener");
    });
  }
}

init();
