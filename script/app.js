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
        } else {
            console.log("The request failed!");
        }
    };
}

function onPageLoad() {
    searchInput.addEventListener("input", () => search());
}

onPageLoad();
