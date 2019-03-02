// ==UserScript==
// @name         YouTube Ads Rewind
// @version      0.1.0
// @description  Rewinds embedded advertisements
// @author       VChet
// @supportURL   https://github.com/VChet/Youtube-Ads-Rewind/issues
// @downloadURL  https://github.com/VChet/Youtube-Ads-Rewind/raw/master/rewind.user.js
// @match        https://www.youtube.com/*
// ==/UserScript==
"use strict"

async function startScript() {
  const ytMenu = document.querySelector("#watch8-secondary-actions");
  const ytPlayer = document.getElementById("movie_player");
  const startButton = document.createElement("button");
  const stopButton = document.createElement("button");
  const sendButton = document.createElement("button");

  function setTiming() {
    const secondsToHms = time => {
      time = Number(time);
      const h = Math.floor(time / 3600);
      const m = Math.floor(time % 3600 / 60);
      const s = Math.floor(time % 3600 % 60);
      return h > 0 ? `${h}:${m}:${s < 10 ? "0" + s : s}` : `${m}:${s < 10 ? "0" + s : s}`;
    }
    this.querySelector("span").dataset.timecode = Math.trunc(ytPlayer.getCurrentTime());
    this.querySelector("span").textContent = secondsToHms(ytPlayer.getCurrentTime());;
  }

  function sendTiming() {
    const starts = startButton.querySelector("span").dataset.timecode;
    const ends = stopButton.querySelector("span").dataset.timecode;
    if (starts && ends) {
      if (starts > ends) {
        return console.warn("[YouTube Ads Rewind] Incorrect time codes");
      }
      const videoId = ytPlayer.getVideoUrl().match("(?<=v=)[^&\n?#]+")[0];
      return console.log({ videoId, starts, ends });
    } else {
      return console.warn("[YouTube Ads Rewind] No time codes");
    }
  }

  startButton.addEventListener("click", setTiming);
  stopButton.addEventListener("click", setTiming);
  sendButton.addEventListener("click", sendTiming);

  const styleClasses = [
    "action-panel-trigger",
    "no-icon-markup",
    "pause-resume-autoplay",
    "yt-uix-button-content",
    "yt-uix-button-opacity",
    "yt-uix-button-size-default",
    "yt-uix-button",
    "yt-uix-tooltip"
  ];

  startButton.classList.add(...styleClasses);
  stopButton.classList.add(...styleClasses);
  sendButton.classList.add(...styleClasses);

  startButton.innerHTML = "Начало <span></span>";
  stopButton.innerHTML = "Конец <span></span>";
  sendButton.innerHTML = "Сообщить";

  ytMenu.append(startButton, stopButton, sendButton);

  const makeRequest = (method, url) => {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = () => {
        if (this.status === 200) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = () => {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    });
  }

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

  const videoId = ytPlayer.getVideoUrl().match("(?<=v=)[^&\n?#]+")[0];
  console.log(`[YouTube Ads Rewind] Current video ID: ${videoId}`);

  // let videosList = await makeRequest("GET", "https://raw.githubusercontent.com/VChet/Youtube-Ads-Rewind/master/db.json");
  let videosList = [{
    videoId: "zSakqtywY5c",
    timings: [{
      "starts": "4",
      "ends": "54"
    },
    {
      "starts": "60",
      "ends": "70"
    }]
  }]
  // videosList = JSON.parse(videosList);
  console.log("[YouTube Ads Rewind] DB has been loaded");
  const videoData = videosList.find(el => el.videoId === videoId);
  let videoTimer;
  if (videoData) {
    videoData.timings.map(timing => console.log(`[YouTube Ads Rewind] Rewind from ${timing.starts} to ${timing.ends}`));
    videoTimer = setInterval(() => rewind(videoData), 100);
  } else {
    return console.log("[YouTube Ads Rewind] This video has no advertising data");
  }
}

window.addEventListener("readystatechange", startScript, true)
window.addEventListener("spfdone", startScript)
