let searchInput = document.getElementById("search"),
  searchButton = document.getElementById("search-btn"),
  WeatherApiToken =
    "6051ed4396ddb33dd0a53913aa5479b93328e2784fab430693ed7cbe340d9557";

/*
 * Search for a cities in the API when the user types in the search bar
 */
function searchInputChanged() {
  let cityName = searchInput.value;
  console.log("City name : " + cityName);

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

  console.log("City choice made : " + city.nom + " (" + city.code + ")");
  let cityName = city.nom,
    codeINSEE = city.code,
    postalCodes = city.codesPostaux;

  document.getElementById("city-name").textContent =
    cityName + " (" + postalCodes[0] + ")";
}

/*
 * Display meteo infos in the HTML page
 */
function displayMeteoInfos(meteoInfos) { }

function onPageLoad() {
  searchInput.addEventListener("input", () => searchInputChanged());
  searchButton.addEventListener("click", () => searchSubmit());
}

onPageLoad();
