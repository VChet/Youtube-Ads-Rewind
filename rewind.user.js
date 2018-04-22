// ==UserScript==
// @name         YouTube Ads Rewind
// @version      0.1
// @description  Rewinds embedded advertisements
// @author       VChet
// @supportURL   https://github.com/VChet/Youtube-Ads-Rewind/issues
// @downloadURL  https://github.com/VChet/Youtube-Ads-Rewind/raw/master/rewind.user.js
// @match        https://www.youtube.com/*
// ==/UserScript==

(function () {
    'use strict'

    const ytMenu = document.querySelector("#watch8-secondary-actions");
    const ytPlayer = document.getElementById("movie_player");
    const startButton = document.createElement("button");
    const stopButton = document.createElement("button");
    const sendButton = document.createElement("button");

    startButton.addEventListener("click", setTiming);
    stopButton.addEventListener("click", setTiming);
    //sendButton.addEventListener("click", sendTiming);

    function setTiming() {
        function secondsToHms(time) {
            time = Number(time);
            const h = Math.floor(time / 3600);
            const m = Math.floor(time % 3600 / 60);
            const s = Math.floor(time % 3600 % 60);
            if (h > 0) {
                return `${h}:${m}:${s < 10 ? "0" + s : s}`;
            } else {
                return `${m}:${s < 10 ? "0" + s : s}`;
            }
        }
        this.querySelector("span").textContent = `${secondsToHms(ytPlayer.getCurrentTime())}`;
    }

    const styleClasses = ["yt-uix-button", "yt-uix-button-content", "yt-uix-button-size-default", "yt-uix-button-opacity", "no-icon-markup", "pause-resume-autoplay", "action-panel-trigger", "yt-uix-tooltip"];

    startButton.classList.add(...styleClasses);
    stopButton.classList.add(...styleClasses);
    sendButton.classList.add(...styleClasses);

    startButton.innerHTML = "Начало <span></span>";
    stopButton.innerHTML = "Конец <span></span>";
    sendButton.innerHTML = "Сообщить";

    ytMenu.append(startButton, stopButton, sendButton);

    const videoId = ytPlayer.getVideoUrl().match("(?<=v=)[^&\n?#]+")[0];
    console.log(`[YouTube Ads Rewind] ${videoId}`);
    checkDB();

    async function checkDB() {
        let videosList = await makeRequest("GET", "https://raw.githubusercontent.com/VChet/Youtube-Ads-Rewind/master/db.json");
        videosList = JSON.parse(videosList);
        if (Object.keys(videosList).indexOf(videoId) > -1) {
            console.log(`[YouTube Ads Rewind] Rewind from ${videosList[videoId].start} to ${videosList[videoId].stop}`);
            setInterval(function () {
                if (ytPlayer.getPlayerState() == 1) {
                    if (ytPlayer.getCurrentTime().toFixed() == videosList[videoId].start) {
                        console.log("[YouTube Ads Rewind] Rewinding...");
                        ytPlayer.seekTo(videosList[videoId].stop);
                    }
                }
            }, 100);
        } else {
            return;
        }
    }

    function makeRequest(method, url) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status === 200) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    }
})();
