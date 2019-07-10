// ==UserScript==
// @name         YouTube Ads Rewind
// @version      0.1.0
// @description  Rewinds embedded advertisements
// @author       VChet
// @supportURL   https://github.com/VChet/Youtube-Ads-Rewind/issues
// @downloadURL  https://github.com/VChet/Youtube-Ads-Rewind/raw/master/rewind.user.js
// @match        https://www.youtube.com/*
// @grant        GM.xmlHttpRequest
// ==/UserScript==
"use strict";

async function startScript() {
  let isClassicDesign;
  if (document.querySelector("meta[http-equiv='origin-trial']")) {
    isClassicDesign = false;
  } else if (document.querySelector("meta[http-equiv='Content-Type']")) {
    console.log("Mobile mode");
    return;
  } else {
    isClassicDesign = true;
  }

  const ytPlayer = document.getElementById("movie_player");
  const videoId = ytPlayer.getVideoData().video_id;
  const server = "http://localhost:7542";
  console.log(`[YouTube Ads Rewind] Current video ID: ${videoId}`);

  function makeRequest(method, url, data = {}) {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method,
        url,
        data,
        onload: res => {
          console.log("[YouTube Ads Rewind] Response status:", res.status);
          const data = JSON.parse(res.responseText);
          resolve(data);
        },
        onerror: error => {
          reject(error);
        }
      });
    });
  }

  function addButtons() {
    let startButton;
    let stopButton;
    let sendButton;
    let ytMenu;
    if (isClassicDesign) {
      startButton = document.createElement("button");
      stopButton = document.createElement("button");
      sendButton = document.createElement("button");
      ytMenu = document.querySelector("#watch8-secondary-actions");
    } else {
      startButton = document.createElement("yt-icon-button");
      stopButton = document.createElement("yt-icon-button");
      sendButton = document.createElement("yt-icon-button");
      ytMenu = document.querySelector("#top-row.ytd-video-secondary-info-renderer");
    }

    function setTiming() {
      const secondsToHms = time => {
        time = Number(time);
        const h = Math.floor(time / 3600);
        const m = Math.floor(time % 3600 / 60);
        const s = Math.floor(time % 3600 % 60);
        return h > 0 ? `${h}:${m}:${s < 10 ? "0" + s : s}` : `${m}:${s < 10 ? "0" + s : s}`;
      };
      this.querySelector("span").dataset.timecode = Math.trunc(ytPlayer.getCurrentTime());
      this.querySelector("span").textContent = secondsToHms(ytPlayer.getCurrentTime());
    }

    async function sendTiming() {
      const starts = startButton.querySelector("span").dataset.timecode;
      const ends = stopButton.querySelector("span").dataset.timecode;
      if (starts && ends) {
        if (starts > ends) return console.warn("[YouTube Ads Rewind] Incorrect time codes");
        const data = {
          id: videoId,
          timings: starts, ends
        };
        const response = await makeRequest("POST", `${server}/api/video/report`, data);
        return console.log({ response });
      } else {
        return console.warn("[YouTube Ads Rewind] No time codes");
      }
    }

    startButton.addEventListener("click", setTiming);
    stopButton.addEventListener("click", setTiming);
    sendButton.addEventListener("click", sendTiming);

    let styleClasses;
    if (isClassicDesign) {
      styleClasses = [
        "action-panel-trigger",
        "no-icon-markup",
        "pause-resume-autoplay",
        "yt-uix-button-content",
        "yt-uix-button-opacity",
        "yt-uix-button-size-default",
        "yt-uix-button",
        "yt-uix-tooltip"
      ];
    } else {
      styleClasses = [

      ];
    }
    startButton.classList.add(...styleClasses);
    stopButton.classList.add(...styleClasses);
    sendButton.classList.add(...styleClasses);

    if (isClassicDesign) {
      startButton.innerHTML = "Starts <span></span>";
      stopButton.innerHTML = "Ends <span></span>";
      sendButton.innerHTML = "Report";
      ytMenu.append(startButton, stopButton, sendButton);
    } else {
      startButton.innerHTML = "<yt-formatted-string>Starts <span></span></yt-formatted-string>";
      stopButton.innerHTML = "<yt-formatted-string>Ends <span></span></yt-formatted-string>";
      sendButton.innerHTML = "<yt-formatted-string>Report</yt-formatted-string>";
      ytMenu.append(startButton, stopButton, sendButton);
    }
  }

  let videoTimer;
  function rewind(videoData) {
    // Video is playing
    if (ytPlayer.getPlayerState() === 1) {
      videoData.timings.map(timing => {
        if (ytPlayer.getCurrentTime().toFixed() === timing.starts) {
          console.log("[YouTube Ads Rewind] Rewinding...");
          ytPlayer.seekTo(timing.ends);
        }
      });
    // Video is ended or queued
    } else if (ytPlayer.getPlayerState() === 0 || ytPlayer.getPlayerState() === 5) {
      console.log("[YouTube Ads Rewind] ClearInterval");
      clearInterval(videoTimer);
    }
  }

  if (ytPlayer.getVideoData().isLive) {
    return console.log("[YouTube Ads Rewind] Script is not available for live translations");
  }
  makeRequest("GET", `${server}/api/video/check?videoId=${videoId}`).then(videoData => {
    addButtons();
    if (videoData.error) {
      return console.log("[YouTube Ads Rewind]", videoData.error);
    } else if (videoData.response) {
      videoData.response.timings.map(timing => console.log(`[YouTube Ads Rewind] Rewind from ${timing.starts} to ${timing.ends}`));
      videoTimer = setInterval(() => rewind(videoData), 100);
    } else {
      return console.log("[YouTube Ads Rewind] This video has no advertising data");
    }
  }).catch(error => {
    if (error.status === 0) {
      return console.log("[YouTube Ads Rewind] Server is unavailable");
    }
    return console.warn("[YouTube Ads Rewind]", {error});
  });
}

window.addEventListener("readystatechange", startScript, true);
window.addEventListener("spfdone", startScript);
window.addEventListener("yt-navigate-start", startScript);
