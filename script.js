document.addEventListener("DOMContentLoaded", function () {
    const apiBaseUrl = "https://www.jma.go.jp/bosai/forecast/data/forecast/";
    const areaJsonUrl = "https://www.jma.go.jp/bosai/common/const/area.json";

    const areaSelect = document.getElementById("area");
    const fetchWeatherBtn = document.getElementById("fetchWeather");
    const weatherDisplay = document.getElementById("weatherDisplay");
    const jsonDisplay = document.getElementById("jsonDisplay");
    const jsonToggle = document.getElementById("jsonToggle");
    const jsonTreeContainer = document.getElementById("jsonTree"); // JSONツリーの表示エリア

    let areaData = {}; // 全エリアデータ
    let currentAreaCode = "130000"; // 初期は東京都

    // 🔹 `area.json` を取得し、offices のエリア一覧を取得
    function fetchAreaData() {
        fetch(areaJsonUrl)
            .then(response => response.json())
            .then(data => {
                areaData = data;
                updateAreaDropdown();
                fetchWeather(currentAreaCode); // 初回は東京都の天気を取得
            })
            .catch(error => console.error("エリア情報の取得に失敗しました:", error));
    }

    // 🔹 プルダウンを `offices` の一覧にする
    function updateAreaDropdown() {
        areaSelect.innerHTML = ""; // 既存オプションをクリア
        let options = [];
        Object.keys(areaData.offices).forEach(code => {
            // 🔹 エリアコードの下二桁が "00" の場合のみ追加
            if (code.endsWith("00")) {
                options.push({ code: code, name: areaData.offices[code].name });
            }
        });

        // 🔹 `options` をプルダウンにセット
        options.sort((a, b) => a.code.localeCompare(b.code)); // エリアコード順にソート
        options.forEach(opt => {
            let optionElement = document.createElement("option");
            optionElement.value = opt.code;
            optionElement.textContent = opt.name;
            areaSelect.appendChild(optionElement);
        });

        // 🔹 初期選択を東京都 (130000)
        areaSelect.value = "130000";
    }

    // 🔹 天気予報を取得 (選択されたエリアのJSONを取得)
    function fetchWeather(areaCode) {
        fetch(`${apiBaseUrl}${areaCode}.json`) // 選択したエリアのJSONを取得
            .then(response => response.json())
            .then(data => {
                displayWeather(data);
                displayJsonTree(data);
            })
            .catch(error => {
                console.error("天気予報の取得に失敗しました:", error);
                weatherDisplay.innerHTML = "<p>天気予報の取得に失敗しました。</p>";
            });
    }

    // 🔹 天気予報データを画面に表示
    function displayWeather(data) {
        if (!data || data.length === 0) {
            weatherDisplay.innerHTML = "<p>データが取得できませんでした。</p>";
            return;
        }

        const timeSeries = data[0].timeSeries.find(series => series.areas);
        if (!timeSeries) {
            weatherDisplay.innerHTML = "<p>データの構造が予想と異なります。</p>";
            return;
        }

        let forecastHTML = "<h2>天気予報一覧</h2>";

        timeSeries.areas.forEach(area => {
            forecastHTML += `<h3>${area.area.name}</h3>`;
            for (let i = 0; i < timeSeries.timeDefines.length; i++) {
                let date = new Date(timeSeries.timeDefines[i]);
                let weather = area.weathers ? area.weathers[i] : "不明";
                forecastHTML += `<p class="forecast-text">${date.toLocaleDateString()}: ${weather}</p>`;
            }
        });

        weatherDisplay.innerHTML = forecastHTML;
    }

    function displayJsonTree(json) {
        jsonTreeContainer.innerHTML = createJsonTree(json); // JSONツリーを挿入
    }

    function createJsonTree(json) {
        if (typeof json !== "object" || json === null) {
            return `<span class="json-value">${JSON.stringify(json)}</span>`;
        }
    
        let html = `<ul class="json-tree">`;
        for (const key in json) {
            const value = json[key];
            const hasChildren = typeof value === "object" && value !== null;
    
            html += `<li>
                        <div class="json-item">
                            ${hasChildren ? 
                                `<span class="json-toggle-icon" onclick="toggleJsonNode(this)">➤</span>` :
                                `<span class="json-no-toggle">•</span>`}
                            <span class="json-key">${key}:</span>
                            ${hasChildren ? "" : `<span class="json-value">${JSON.stringify(value)}</span>`}
                        </div>
                        ${hasChildren ? `<div class="json-node hidden">${createJsonTree(value)}</div>` : ""}
                    </li>`;
        }
        html += `</ul>`;
    
        return html;
    }
    

    window.toggleJsonNode = function (element) {
        const node = element.parentNode.nextElementSibling; // 🔹 JSONノードの子要素を取得
        if (node && node.classList.contains("json-node")) {
            node.classList.toggle("hidden");
    
            // 🔹 三角形（➤ / ▼）の切り替え
            element.textContent = node.classList.contains("hidden") ? "➤" : "▼";
    
            // 🔹 明示的に `display: block;` を適用
            if (!node.classList.contains("hidden")) {
                node.style.display = "block";
            } else {
                node.style.display = "none";
            }
        }
    };
    

    jsonToggle.addEventListener("click", function () {
        jsonDisplay.classList.toggle("hidden");
        jsonToggle.textContent = jsonDisplay.classList.contains("hidden") ? "➤ 参考情報: 取得JSON" : "▼ 参考情報: 取得JSON";
    
        // 🔹 `jsonDisplay` の `display` を明示的に切り替え
        if (!jsonDisplay.classList.contains("hidden")) {
            jsonDisplay.style.display = "block";
        } else {
            jsonDisplay.style.display = "none";
        }
    });

    // 🔹 ボタンを無効化してAPI負荷を抑える
    function disableButtonForSeconds(seconds) {
        fetchWeatherBtn.disabled = true;
        setTimeout(() => {
            fetchWeatherBtn.disabled = false;
        }, seconds * 1000);
    }

    // 🔹 初回 `area.json` を取得
    fetchAreaData();

    // 🔹 ボタンを押したら天気を取得
    fetchWeatherBtn.addEventListener("click", function () {
        fetchWeather(areaSelect.value);
        disableButtonForSeconds(5);
    });
});
