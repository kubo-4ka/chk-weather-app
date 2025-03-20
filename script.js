document.addEventListener("DOMContentLoaded", function () {
    const apiBaseUrl = "https://www.jma.go.jp/bosai/forecast/data/forecast/";
    const areaJsonUrl = "https://www.jma.go.jp/bosai/common/const/area.json";

    const areaSelect = document.getElementById("area");
    const fetchWeatherBtn = document.getElementById("fetchWeather");
    const weatherDisplay = document.getElementById("weatherDisplay");

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
                forecastHTML += `<p class="forecast-text">${date.toLocaleDateString()}: ${weather}</p>`;            }
        });

        weatherDisplay.innerHTML = forecastHTML;
    }

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
