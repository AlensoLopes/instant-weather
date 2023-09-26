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
  currentCity = null,
  WeatherApiToken =
    "6051ed4396ddb33dd0a53913aa5479b93328e2784fab430693ed7cbe340d9557";

/*
 * Search for a cities in the API when the user types in the search bar
 */

function searchInputChanged(){
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

    fetch(apiURL)
    .then(res => response = res.json())
    .then(data =>{
      if (data.length == 0 && cityName.length > 0) {
          displayCitiesGuesses(data, true);
        } else if (cityName.length > 0) {
          displayCitiesGuesses(data);
        } else {
          displayCitiesGuesses("");
        }
    })
    .catch(error => {
      console.error(
          "The request failed : " + apiURL + " " + error);
    });
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
      cityDiv.innerHTML = city.nom + " (" + city.codesPostaux[0] + ")";
      cityDiv.addEventListener("click", () => {
        currentCity = city;
        cityChoiceMade(city);
      });
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

  document.querySelector(".content").classList.remove("content-active");
  document
    .querySelector("img.loading-icon")
    .classList.replace("loading-icon", "loading-icon-active");
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
      setTimeout(
        () => displayMeteoInfos(meteoInfos),
        Math.random() * 1000 + 500
      );
    } else if (xhttpr.status === 400) {
      displayMessage(
        "City's meteo unavailable",
        "We're sorry but the meteo is not available for this city."
      );
      document
        .querySelector(".content")
        .classList.remove("content-active");
      document
        .querySelector("img.loading-icon-active")
        .classList.replace("loading-icon-active", "loading-icon");
      searchInput.value = "";
    } else {
      console.error(
        "The request failed : " + apiURL + " " + xhttpr.status
      );
    }
  };
}

/*
 * Display a message in the HTML page
 */
function displayMessage(title, body) {
  document.querySelector(".message h3").textContent = title;
  document.querySelector(".message p").innerHTML = body;
  document.getElementById("infoMessageContainer").classList.remove("hidden");
}

/*
 * Display meteo infos in the HTML page
 */
function displayMeteoInfos(response) {
  console.log(response);
  localStorage.setItem("response", JSON.stringify(response));
  document.getElementById("city-name").textContent = response.city.name;

  document
    .querySelector(".loading-icon-active")
    .classList.replace("loading-icon-active", "loading-icon");

  // Current weather
  displayCurrentWeather(response);
  // Hourly forecast
  // displayHourlyForecast();
  // n-days forecast
  displayNDaysForecast(response);

  document.querySelector(".content").classList.add("content-active");
}

/*
 * Display the current weather
 */
function displayCurrentWeather(response) {
  let date = new Date(response.forecast[0].datetime);
  let weekday = returnWeekDay(date.getDay());

  document.querySelector(".currentWeather h4").textContent =
    weekday + " " + date.getDate();

  document.querySelector(".currentWeather .tempMax").textContent =
    response.forecast[0].tmax + "°";
  document.querySelector(".currentWeather .tempMin").textContent =
    response.forecast[0].tmin + "°";
  document.querySelector(".currentWeather .probRain").textContent =
    response.forecast[0].probarain + "%";
  document.querySelector(".currentWeather .sunDuration").textContent =
    response.forecast[0].sun_hours + "h";

  document
    .querySelector(".currentWeather .card")
    .addEventListener("click", () => {
      let bodyText = "";
      if (settings.latitude) {
        bodyText +=
          "The latitude is " + response.city.latitude + ".<br>";
      }
      if (settings.longitude) {
        bodyText +=
          "The longitude is " + response.city.longitude + ".<br>";
      }
      if (settings.rainfall) {
        bodyText +=
          "The rainfall will be " +
          response.forecast[0].probarain +
          "%.<br>";
      }
      if (settings.averageWind) {
        bodyText +=
          "The average wind will be " +
          response.forecast[0].wind10m +
          "km/h.<br>";
      }
      if (settings.windDirection) {
        bodyText +=
          "The wind will blow from " +
          response.forecast[0].dirwind10m +
          "°.<br>";
      }

      bodyText.length > 0
        ? displayMessage(
          weekday +
          " " +
          date.getDate() +
          " - Additional informations",
          bodyText
        )
        : null;
    });
}

/*
 * Return the day of the week based on the day number
 */
function returnWeekDay(dayNb) {
  switch (dayNb) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    default:
      return "Saturday";
  }
}

/*
 * Display the forecast for the next days
 */
function displayNDaysForecast(response) {
  document.querySelector(".days-forecast h3").textContent =
    settings.forecastDuration +
    (settings.forecastDuration > 1 ? " days forecast" : " day forecast");

  // Remove previous forecast
  let daysForecast = document.querySelectorAll(".days-forecast .daily-card");
  for (let i = 0; i < daysForecast.length; i++) {
    daysForecast[i].remove();
  }

  let i = 1;
  while (i < response.forecast.length && i <= settings.forecastDuration) {
    let day = response.forecast[i],
      date = new Date(day.datetime);
    let weekday = returnWeekDay(date.getDay()).substring(0, 3) + ".";

    let dayDiv = document.createElement("div");
    dayDiv.classList.add("daily-card");

    let dayTitle = document.createElement("h4");
    dayTitle.classList.add("day-title");
    dayTitle.textContent = weekday + " " + date.getDate();

    let illustration = document.createElement("img");
    illustration.src = "assets/img/weather_icons/day.svg";
    illustration.alt = day.weather;

    let table = document.createElement("table");
    table.innerHTML = `<tr>
          <td>
          <span class="tempMax">${day.tmax}°</span>
          <i
              class="fa-solid fa-temperature-arrow-up"
          ></i>
        </td>
        <td>
          <span class="tempMin">${day.tmin}°</span>
          <i
              class="fa-solid fa-temperature-arrow-down"
          ></i>
        </td>
      </tr>
      <tr>
        <td>
          <span class="probRain">${day.probarain}%</span>
          <i class="fa-solid fa-droplet"></i>
        </td>
        <td>
          <span class="sunDuration">${day.sun_hours}h</span>
          <i class="fa-solid fa-sun"></i>
        </td>
      </tr>`;

    dayDiv.appendChild(dayTitle);
    dayDiv.appendChild(illustration);
    dayDiv.appendChild(table);

    let bodyText = "";
    if (settings.rainfall) {
      bodyText += "The rainfall will be " + day.probarain + "%.<br>";
    }
    if (settings.averageWind) {
      bodyText += "The average wind will be " + day.wind10m + "km/h.<br>";
    }
    if (settings.windDirection) {
      bodyText += "The wind will blow from " + day.dirwind10m + "°.<br>";
    }

    dayDiv.addEventListener("click", () => {
      bodyText.length > 0
        ? displayMessage(
          dayTitle.textContent + " - Additional informations",
          bodyText
        )
        : null;
    });

    document.querySelector(".days-forecast .card").appendChild(dayDiv);

    i++;
  }
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

  if (currentCity != null) {
    cityChoiceMade(currentCity);
  }
}

function onPageLoad() {
  // Adding event listeners
  searchInput.addEventListener("input", () => searchInputChanged());
  searchInput.addEventListener("focus", () => searchInputChanged());
  window.addEventListener("click", function (mouseEvent) {
    if (
      !document.getElementById("cityGuesses").contains(mouseEvent.target)
    ) {
      let cityGuesses = document.getElementsByClassName("cityGuess");
      while (cityGuesses[0]) {
        cityGuesses[0].parentNode.removeChild(cityGuesses[0]);
      }
    }
  });
  searchButton.addEventListener("click", () => displaySearchSettings());
  forecastDurationInput.addEventListener("input", () => {
    document.getElementById("forecast-duration-label").textContent =
      "Forecast duration : " + forecastDurationInput.value + " days";
  });
  document.querySelector(".message button").addEventListener("click", () => {
    document.getElementById("infoMessageContainer").classList.add("hidden");
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
  document.querySelector(".days-forecast h3").textContent =
    settings.forecastDuration +
    (settings.forecastDuration > 1 ? " days forecast" : " day forecast");
}

onPageLoad();
