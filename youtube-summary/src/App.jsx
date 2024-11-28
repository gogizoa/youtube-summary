// App.jsx
import React, { useEffect, useState } from "react";
import DraggablePopup from "./components/DraggablePopup";
import useVideoStore from "./stores/VideoStore";

function App() {
  const setVideo = useVideoStore((state) => state.setVideo);
  const setIsPopupOpen = useVideoStore((state) => state.setIsPopupOpen);

  // 버튼이 존재하는지 확인하는 함수
  const isSummaryButtonExists = () => {
    return document.querySelector("#summary-button") !== null;
  };

  // owner 컨테이너를 찾는 함수
  const findOwnerContainer = () => {
    return document.querySelector("#owner");
  };

  // YouTube URL에서 video ID를 추출하는 함수
  const getVideoId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  };

  // Summary 버튼을 생성하고 추가하는 함수
  const addSummaryButton = async () => {
    if (isSummaryButtonExists() || !findOwnerContainer()) {
      return;
    }

    if (window.isCreatingSummaryButton) {
      return;
    }

    window.isCreatingSummaryButton = true;

    try {
      const ownerContainer = findOwnerContainer();

      const buttonContainer = document.createElement("div");
      buttonContainer.id = "summary-button";
      buttonContainer.className = "style-scope ytd-watch-metadata";
      buttonContainer.style.display = "inline-block";
      buttonContainer.style.marginLeft = "8px";

      const button = document.createElement("button");
      button.className =
        "yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
      button.style.backgroundColor = "#2ea043";
      button.style.color = "white";

      const textContent = document.createElement("div");
      textContent.className = "yt-spec-button-shape-next__button-text-content";
      textContent.innerHTML =
        '<span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">SUMMARY</span>';
      button.appendChild(textContent);

      setVideo({
        videoId: getVideoId(),
        title: document.querySelector("#title h1")?.textContent?.trim(),
      });

      // 클릭 이벤트를 팝업 열기로 변경
      button.addEventListener("click", () => {
        setIsPopupOpen(true);
      });

      buttonContainer.appendChild(button);
      ownerContainer.appendChild(buttonContainer);
    } finally {
      window.isCreatingSummaryButton = false;
    }
  };

  // 디바운스 함수
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 페이지 변경을 감지하는 함수
  const handlePageChange = () => {
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
  };

  useEffect(() => {
    let lastUrl = location.href;

    // URL 변경 감지를 위한 옵저버
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

    // 컴포넌트 언마운트 시 옵저버 정리
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div id="youtube-summary-extension">
      <DraggablePopup />
    </div>
  );
}

export default App;
