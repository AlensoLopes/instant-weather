let searchInput = document.getElementById("search");

function search() {
    let cityName = searchInput.value;
    let apiURL = "https://geo.api.gouv.fr/communes?nom="+cityName+"&fields=departement&boost=population&limit=5"

    const xhttpr = new XMLHttpRequest();
    xhttpr.open("GET", apiURL, true);

    xhttpr.send();
    console.log("Request sent : "+apiURL);

    xhttpr.onload = () => {
        if (xhttpr.status === 200) {
            const response = JSON.parse(xhttpr.response);
            console.log(response);
            displayCitiesGuesses(response);
        } else {
            console.log("The request failed!");
        }
    };
}

function displayCitiesGuesses(citiesGuesses) {
    let cityGuessesDiv = document.getElementById("cityGuesses");

    let cityGuesses = document.getElementsByClassName("cityGuess");
    while (cityGuesses[0]) {
        cityGuesses[0].parentNode.removeChild(cityGuesses[0]);
    }

    for (let i = 0; i < citiesGuesses.length; i++) {
        let city = citiesGuesses[i];
        let cityDiv = document.createElement("div");
        cityDiv.classList.add("cityGuess");
        cityDiv.innerHTML = city.nom;
        cityGuessesDiv.appendChild(cityDiv);
    }
}

function onPageLoad() {
    searchInput.addEventListener("input", () => search());
}

onPageLoad();
