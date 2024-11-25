// 버튼이 이미 존재하는지 확인하는 함수
function isSummaryButtonExists() {
  return document.querySelector("#summary-button") !== null;
}

// owner 컨테이너를 찾는 함수
function findOwnerContainer() {
  return document.querySelector("#owner");
}

// YouTube URL에서 video ID를 추출하는 함수
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
}

// Summary 버튼을 생성하고 추가하는 함수
async function addSummaryButton() {
  // 이미 버튼이 있거나 owner 컨테이너가 없으면 종료
  if (isSummaryButtonExists() || !findOwnerContainer()) {
    return;
  }

  // 버튼 생성 중 플래그 설정
  if (window.isCreatingSummaryButton) {
    return;
  }
  window.isCreatingSummaryButton = true;

  try {
    const ownerContainer = findOwnerContainer();

    // 새로운 div 컨테이너 생성
    const buttonContainer = document.createElement("div");
    buttonContainer.id = "summary-button";
    buttonContainer.className = "style-scope ytd-watch-metadata";
    buttonContainer.style.display = "inline-block";
    buttonContainer.style.marginLeft = "8px";

    // 버튼 생성
    const button = document.createElement("button");
    button.className =
      "yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
    button.style.backgroundColor = "#2ea043";
    button.style.color = "white";

    // 버튼 내용 설정
    const textContent = document.createElement("div");
    textContent.className = "yt-spec-button-shape-next__button-text-content";
    textContent.innerHTML =
      '<span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">SUMMARY</span>';
    button.appendChild(textContent);

    const videoId = getVideoId();
    const videoData = {
      id: videoId,
      title: document.querySelector("#title h1")?.textContent?.trim(),
      channel: document.querySelector("#channel-name a")?.textContent?.trim(),
    };

    // 데이터를 로컬 스토리지에 저장
    await chrome.storage.local.set({ videoData });

    // 클릭 이벤트 추가
    button.addEventListener("click", async () => {
      chrome.runtime.sendMessage({ action: "openPopup" });
    });

    // 버튼을 컨테이너에 추가
    buttonContainer.appendChild(button);
    ownerContainer.appendChild(buttonContainer);
  } finally {
    // 생성 완료 후 플래그 초기화
    window.isCreatingSummaryButton = false;
  }
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 페이지 변경을 감지하는 함수
function handlePageChange() {
  const debouncedAddButton = debounce(() => {
    if (findOwnerContainer() && !isSummaryButtonExists()) {
      addSummaryButton();
    }
  }, 500);

  const checkInterval = setInterval(() => {
    debouncedAddButton();
    if (isSummaryButtonExists()) {
      clearInterval(checkInterval);
    }
  }, 1000);

  // 10초 후에도 버튼이 없으면 인터벌 정지
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 10000);
}

// URL 변경 감지 (단일 옵저버 사용)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    handlePageChange();
  }

  if (findOwnerContainer() && !isSummaryButtonExists()) {
    addSummaryButton();
  }
});

// 옵저버 설정 및 시작
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 초기 페이지 로드 시 실행
handlePageChange();
