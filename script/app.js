import { dictIcon } from "./iconDict.js";

let searchInput = document.getElementById("search"),
    searchButton = document.getElementById("search-btn"),
    forecastDurationInput = document.getElementById("forecast-duration"),
    latitudeInput = document.getElementById("latitude"),
    longitudeInput = document.getElementById("longitude"),
    rainfallInput = document.getElementById("rainfall"),
    averageWindInput = document.getElementById("average-wind"),
    windDirectionInput = document.getElementById("wind-direction"),
    wc,
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

    fetch(apiURL)
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            if (res.length == 0 && cityName.length > 0) {
                displayCitiesGuesses(res, true);
            } else if (cityName.length > 0) {
                displayCitiesGuesses(res);
            } else {
                displayCitiesGuesses("");
            }
        })
        .catch((error) => {
            console.error("The request failed : " + apiURL + " " + error);
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
    wc = new WeatherCard(city.code);
}

function noMeteo() {
    displayMessage(
        "City's meteo unavailable",
        "We're sorry but the meteo is not available for " + "this city."
    );
    document.querySelector(".content").classList.remove("content-active");
    document
        .querySelector("img.loading-icon-active")
        .classList.replace("loading-icon-active", "loading-icon");
    searchInput.value = "";
}

function hourlyAPIRequest(city) {
    let apiURL =
        "https://api.meteo-concept.com/api/forecast/nextHours?token=" +
        WeatherApiToken +
        "&insee=" +
        city.code +
        "&hourly=true";

    fetch(apiURL)
        .then((response) => (response = response.json()))
        .then((data) => {
            displayHourlyInfos(data);
        });
}

/*
 * Display hourly infos
 */
function displayHourlyForecast() {
    const spacing = 70;

    const forecastCard = document.querySelector(".hourly-forecast .card");
    const curve = document.querySelector(".hourly-forecast .card #tCurve");
    const hoursNumber = wc.hourlyForecast.length;

    // Remove previous forecast
    let hoursForecast = document.querySelectorAll(".to-refresh");
    for (let i = 0; i < hoursForecast.length; i++) {
        hoursForecast[i].remove();
    }

    let timeList = [];
    let tempList = [];
    let probaRainList = [];
    let weatherList = [];
    //fill the lists
    wc.hourlyForecast.forEach((element) => {
        timeList.push(element.datetime);
        tempList.push(element.temp2m);
        probaRainList.push(element.probarain);
        weatherList.push(element.weather);
    });

    console.log(tempList);
    //TIMESTAMPS
    for (let i = 0; i < hoursNumber; i++) {
        //time
        let hourTime = document.createElement("div");
        hourTime.textContent = timeList[i]
            .split("T")[1]
            .split("+")[0]
            .substring(0, 5);
        hourTime.classList.add("time");
        hourTime.classList.add("to-refresh");
        hourTime.style.left = `${10 + spacing * i}px`;
        forecastCard.appendChild(hourTime);
    }

    //CURVE + TEMPERATURE LABELS
    //set curve div width
    curve.style.width = `${spacing * hoursNumber}px`;
    //set curve clip path & temperature labels
    const maxTemp = Math.max.apply(Math, tempList);
    const minTemp = Math.min.apply(Math, tempList);
    //Y axis goes down!
    //minY : the Y of the max temperature, opposite for maxY
    const minY = 10;
    const maxY = 60;
    let getY = (valT) => {
        const ratio = 1 - (valT - minTemp) / (maxTemp - minTemp);
        return ratio * (maxY - minY) + minY;
    };

    let path = `path("`;
    path += `M0,${getY(tempList[0])}`;
    for (let i = 0; i < hoursNumber; i++) {
        let x = spacing * i;
        let y = getY(tempList[i]);
        //CURVE
        path += ` L${25 + x},${y}`;
        //TEMPERATURE LABELS
        let temp = document.createElement("div");
        temp.textContent = tempList[i];
        temp.classList.add("temp");
        temp.classList.add("to-refresh");
        temp.style.left = `${20 + x}px`;
        temp.style.top = `${y - 10}px`;
        forecastCard.appendChild(temp);
    }
    //close the path
    path += ` L${spacing * hoursNumber * 2},${getY(tempList[hoursNumber - 1])}`;
    path += `L${spacing * hoursNumber * 2},${maxY * 2} L0,${maxY * 2}Z")`;
    console.log(path);
    curve.style.clipPath = path;

    /*response.forecast.forEach(element =>{
    console.log(element.temp2m);
    console.log(element.probarain);
    console.log(element.weather); 
    //time
    let hourTime = document.createElement("div");
	hourTime.textContent = element.datetime.split('T')[1].split('+')[0].substring(0, 5));
	hourTime.classList.add("time");
	hourTime.style.
	forecastCard.appendChild(hourTime);
  });*/
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

function displayMeteoInfos() {
    document.getElementById("city-name").textContent = wc.cityName;

    document
        .querySelector(".loading-icon-active")
        .classList.replace("loading-icon-active", "loading-icon");

    // Current weather
    displayCurrentWeather();
    // Hourly forecast
    // displayHourlyForecast(); not done here
    // n-days forecast
    displayNDaysForecast();

    document.querySelector(".content").classList.add("content-active");
}

/*
 * Display the current weather
 */
function displayCurrentWeather() {
    let weekday = returnWeekDay(wc.date.getDay());

    document.querySelector(".currentWeather h4").textContent =
        weekday + " " + wc.date.getDate();

    if (new Date().getHours() < 8 || new Date().getHours() > 20) {
        document.querySelector(".card div img").src =
            "assets/img/icons/" + dictIcon["nightIcon"][wc.day[1].weatherCode];
        document.querySelector(".card div img").alt =
            dictIcon["alt"][wc.day[1].weatherCode];
    } else {
        document.querySelector(".card div img").src =
            "assets/img/icons/" + dictIcon["dayIcon"][wc.day[1].weatherCode];
        document.querySelector(".card div img").alt =
            dictIcon["alt"][wc.day[1].weatherCode];
    }

    document.querySelector(".currentWeather .tempMax").textContent =
        wc.day[1].tmax + "°";
    document.querySelector(".currentWeather .tempMin").textContent =
        wc.day[1].tmin + "°";
    document.querySelector(".currentWeather .probRain").textContent =
        wc.day[1].probarain + "%";
    document.querySelector(".currentWeather .sunDuration").textContent =
        wc.day[1].sun_hours + "h";

    document
        .querySelector(".currentWeather .card")
        .addEventListener("click", () => {
            let bodyText = "";
            bodyText += document.querySelector(".card div img").alt + ".<br>";
            if (settings.latitude) {
                bodyText += "The latitude is " + wc.latitude + ".<br>";
            }
            if (settings.longitude) {
                bodyText += "The longitude is " + wc.longitude + ".<br>";
            }
            if (settings.rainfall) {
                bodyText +=
                    "The rainfall will be " + wc.day[1].probarain + "%.<br>";
            }
            if (settings.averageWind) {
                bodyText +=
                    "The average wind will be " +
                    wc.day[1].wind10m +
                    "km/h.<br>";
            }
            if (settings.windDirection) {
                bodyText +=
                    "The wind will blow from " +
                    wc.day[1].dirwind10m +
                    "°.<br>";
            }

            bodyText.length > 0
                ? displayMessage(
                      weekday +
                          " " +
                          wc.date.getDate() +
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
function displayNDaysForecast() {
    document.querySelector(".days-forecast h3").textContent =
        settings.forecastDuration +
        (settings.forecastDuration > 1 ? " days forecast" : " day forecast");

    // Remove previous forecast
    let daysForecast = document.querySelectorAll(".days-forecast .daily-card");
    for (let i = 0; i < daysForecast.length; i++) {
        daysForecast[i].remove();
    }

    let i = 2;
    while (i < wc.day.length && i - 1 <= settings.forecastDuration) {
        let day = wc.day[i],
            date = new Date(day.date);
        let weekday = returnWeekDay(date.getDay()).substring(0, 3) + ".";

        let dayDiv = document.createElement("div");
        dayDiv.classList.add("daily-card");

        let dayTitle = document.createElement("h4");
        dayTitle.classList.add("day-title");
        dayTitle.textContent = weekday + " " + date.getDate();

        let illustration = document.createElement("img");
        illustration.src =
            "assets/img/icons/" + dictIcon["dayIcon"][wc.day[i].weatherCode];
        illustration.alt = dictIcon["alt"][wc.day[i].weatherCode];

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
        bodyText += illustration.alt + ".<br>";
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
    document
        .getElementById("settingsSaveButton")
        .addEventListener("click", () => updateSearchSettings());
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

class WeatherCard {
    codeInsee;
    cityName;
    latitude;
    longitude;
    date;
    weekday;
    day = new Array({
        weatherCode: -1,
        tmax: 0,
        tmin: 0,
        probarain: 0,
        sun_hours: 0,
        wind10m: 0,
        dirwind10m: 0,
    });
    hourlyForecast;
    constructor(codeInsee) {
        this.codeInsee = codeInsee;

        this.meteoAPIRequestDaily(codeInsee);
        this.meteoAPIRequestHourly(codeInsee);
    }

    /*
     * Retrieve the weather data from the API
     */

    meteoAPIRequestDaily(codeInsee) {
        let apiURL =
            "https://api.meteo-concept.com/api/forecast/daily?token=" +
            WeatherApiToken +
            "&insee=" +
            codeInsee;

        codeInsee >= 97000 && codeInsee < 99000
            ? noMeteo()
            : fetch(apiURL)
                  .then((response) => {
                      if (!response.ok) {
                          throw new Error();
                      } else return response.json();
                  })
                  .then((response) => {
                      setTimeout(() => {
                          this.assignMeteoInfos(response);
                          displayMeteoInfos();
                      }, Math.random() * 1000 + 500);
                  })
                  .catch(() => {
                      noMeteo();
                  });
    }

    meteoAPIRequestHourly(codeInsee) {
        let apiURL =
            "https://api.meteo-concept.com/api/forecast/nextHours?token=" +
            WeatherApiToken +
            "&insee=" +
            codeInsee +
            "&hourly=true";

        codeInsee >= 97000 && codeInsee < 99000
            ? noMeteo()
            : fetch(apiURL)
                  .then((response) => {
                      if (!response.ok) {
                          throw new Error();
                      } else return response.json();
                  })
                  .then((response) => {
                      setTimeout(() => {
                          console.log(response);
                          this.hourlyForecast = response.forecast;
                          displayHourlyForecast();
                      }, Math.random() * 1000 + 500);
                  })
                  .catch(() => {
                      noMeteo();
                  });
    }
    assignMeteoInfos(response) {
        this.cityName = response.city.name;
        this.latitude = response.city.latitude;
        this.longitude = response.city.longitude;
        this.date = new Date(response.forecast[0].datetime);
        this.weekday = returnWeekDay(this.date.getDay());
        this.forecast = response.forecast;
        response.forecast.forEach((day) => {
            this.day.push({
                date: new Date(day.datetime),
                weatherCode: day.weather,
                tmax: day.tmax,
                tmin: day.tmin,
                probarain: day.probarain,
                sun_hours: day.sun_hours,
                wind10m: day.wind10m,
                dirwind10m: day.dirwind10m,
            });
        });
    }
}

onPageLoad();
