let searchInput = document.getElementById("search"),
    searchButton = document.getElementById("search-btn"),
    forecastDurationInput = document.getElementById("forecast-duration"),
    latitudeInput = document.getElementById("latitude"),
    longitudeInput = document.getElementById("longitude"),
    rainfallInput = document.getElementById("rainfall"),
    averageWindInput = document.getElementById("average-wind"),
    windDirectionInput = document.getElementById("wind-direction"),
    settings = {
        forecastDuration: 7,
        latitude: false,
        longitude: false,
        rainfall: false,
        averageWind: false,
        windDirection: false,
    },
    WeatherApiToken =
        "6051ed4396ddb33dd0a53913aa5479b93328e2784fab430693ed7cbe340d9557";

/*
 * Search for a cities in the API when the user types in the search bar
 */
function searchInputChanged() {
    let cityName = searchInput.value;

    let apiURL =
        "https://geo.api.gouv.fr/communes?nom=" +
        cityName +
        "&fields=nom,code,codesPostaux&boost=population&limit=5";
    // Check if the value is a postal code
    if (!isNaN(cityName)) {
        apiURL =
            "https://geo.api.gouv.fr/communes?codePostal=" +
            cityName +
            "&fields=nom,code,codesPostaux";
    }

    const xhttpr = new XMLHttpRequest();
    xhttpr.open("GET", apiURL, true);

    xhttpr.send();
    // console.log("Request sent : "+apiURL);

    xhttpr.onload = () => {
        if (xhttpr.status === 200) {
            const response = JSON.parse(xhttpr.response);
            // console.log(response);
            if (response.length == 0 && cityName.length > 0) {
                displayCitiesGuesses(response, true);
            } else if (cityName.length > 0) {
                displayCitiesGuesses(response);
            } else {
                displayCitiesGuesses("");
            }
        } else {
            alert("The request failed!");
        }
    };
}

/*
 * Display the cities guesses in the HTML page
 */
function displayCitiesGuesses(citiesGuesses, isNoCitiesFound) {
    let cityGuessesDiv = document.getElementById("cityGuesses");

    let cityGuesses = document.getElementsByClassName("cityGuess");
    while (cityGuesses[0]) {
        cityGuesses[0].parentNode.removeChild(cityGuesses[0]);
    }

    if (isNoCitiesFound) {
        let cityDiv = document.createElement("div");
        cityDiv.classList.add("cityGuess");
        cityDiv.innerHTML = "No city found for : " + searchInput.value;
        cityGuessesDiv.appendChild(cityDiv);
    } else {
        for (let i = 0; i < citiesGuesses.length; i++) {
            let city = citiesGuesses[i];
            let cityDiv = document.createElement("div");
            cityDiv.classList.add("cityGuess");
            cityDiv.innerHTML = city.nom;
            cityDiv.addEventListener("click", () => cityChoiceMade(city));
            cityGuessesDiv.appendChild(cityDiv);
        }
    }
}

/*
 * Retrieve the weather data from the API
 */
function cityChoiceMade(city) {
    searchInput.value = city.nom;
    let cityGuesses = document.getElementsByClassName("cityGuess");
    while (cityGuesses[0]) {
        cityGuesses[0].parentNode.removeChild(cityGuesses[0]);
    }

    meteoAPIRequest(city);
}

/*
 * Retrieve the weather data from the API
 */
function meteoAPIRequest(city) {
    let apiURL =
        "https://api.meteo-concept.com/api/forecast/daily?token=" +
        WeatherApiToken +
        "&insee=" +
        city.code;

    const xhttpr = new XMLHttpRequest();
    xhttpr.open("GET", apiURL, true);

    xhttpr.send();
    // console.log("Request sent : "+apiURL);

    xhttpr.onload = () => {
        if (xhttpr.status === 200) {
            const meteoInfos = JSON.parse(xhttpr.response);
            displayMeteoInfos(meteoInfos);
        } else {
            console.log("The request failed : " + apiURL);
        }
    };
}

/*
 * Display meteo infos in the HTML page
 */
function displayMeteoInfos(meteoInfos) {
    console.log(meteoInfos);
    document.getElementById("city-name").textContent = meteoInfos.city.name;
}

/*
 * Display search settings in the HTML page
 */
function displaySearchSettings() {
    document.getElementById("search-settings").classList.toggle("hidden");
}

/*
 * Update search settings
 */
function updateSearchSettings() {
    document.getElementById("search-settings").classList.toggle("hidden");

    settings.forecastDuration = forecastDurationInput.value;
    settings.latitude = latitudeInput.checked;
    settings.longitude = longitudeInput.checked;
    settings.rainfall = rainfallInput.checked;
    settings.averageWind = averageWindInput.checked;
    settings.windDirection = windDirectionInput.checked;

    localStorage.setItem("settings", JSON.stringify(settings));
}

function onPageLoad() {
    // Adding event listeners
    searchInput.addEventListener("input", () => searchInputChanged());
    searchButton.addEventListener("click", () => displaySearchSettings());
    forecastDurationInput.addEventListener("input", () => {
        document.getElementById("forecast-duration-label").textContent =
            "Forecast duration : " + forecastDurationInput.value + " days";
    });

    // Handling search settings stored in local storage
    if (localStorage.getItem("settings") === null) {
        localStorage.setItem("settings", JSON.stringify(settings));
    } else {
        settings = JSON.parse(localStorage.getItem("settings"));
    }

    forecastDurationInput.value = settings.forecastDuration;
    latitudeInput.checked = settings.latitude;
    longitudeInput.checked = settings.longitude;
    rainfallInput.checked = settings.rainfall;
    averageWindInput.checked = settings.averageWind;
    windDirectionInput.checked = settings.windDirection;
    document.getElementById("forecast-duration-label").textContent =
        "Forecast duration : " + forecastDurationInput.value + " days";
}

onPageLoad();
