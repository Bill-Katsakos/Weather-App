$(document).ready(function () {
  // ====== Settings ======
  const apiKey = '<API>';
  let units = "metric"; // Start with Celsius
  let cityName = ""; // Stores the current city name from input

  // ====== Global Variables ======
  let globalDataNow = null;
  let globalDataForecast = null;

  // Initial data in metric units
  let initialDataNowMetric = null;
  let initialDataForecastMetric = null;

  // ====== Helper Function to Calculate Local Date ======
  function getLocalDate(dataNow) {
    const localTimestamp = (dataNow.dt + dataNow.timezone) * 1000;
    return new Date(localTimestamp);
  }

  // ====== Function to Return Formatted Date (e.g., "Thu, 09 Jan") ======
  function getCurrentDateFormatted(dataNow) {
    const localDate = getLocalDate(dataNow);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    let dayName = days[localDate.getUTCDay()];
    let monthName = months[localDate.getUTCMonth()];
    let day = localDate.getUTCDate();

    if (day < 10) day = "0" + day;

    return `${dayName}, ${day} ${monthName}`;
  }

  // ====== Function to Return Formatted Time ======
  function getCurrentTimeFormatted(dataNow) {
    const localDate = getLocalDate(dataNow);
    let hours = localDate.getUTCHours();
    let minutes = localDate.getUTCMinutes();

    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    minutes = minutes.toString().padStart(2, "0");

    return `${hours}:${minutes} ${period}`;
  }

  // ====== Convert DateTime String to AM/PM Format ======
  function convertTimeToAmPm(dateTimeStr, timezoneOffset) {
    const [datePart, timePart] = dateTimeStr.split(" ");
    const [hours, minutes, seconds] = timePart.split(":").map(Number);

    const utcDate = new Date(Date.UTC(
      Number(datePart.split("-")[0]),
      Number(datePart.split("-")[1]) - 1,
      Number(datePart.split("-")[2]),
      hours,
      minutes,
      seconds
    ));

    const localTimestamp = utcDate.getTime() + timezoneOffset * 1000;
    const localDate = new Date(localTimestamp);

    let localHours = localDate.getUTCHours();
    let localMinutes = localDate.getUTCMinutes();

    const period = localHours >= 12 ? "PM" : "AM";
    localHours = localHours % 12 || 12;
    const formattedMinutes = localMinutes.toString().padStart(2, "0");

    return `${localHours}:${formattedMinutes} ${period}`;
  }

  // ====== Category Backgrounds Mapping ======
  const categoryBackgrounds = {
    clearSky: "linear-gradient(to top right, #22c1c3, #45b4d4, #72a2e1, #9b91e5, #fdbb2d)",
    clouds: "linear-gradient(to top right, #304352, #4d5465, #6c6b7d, #9b94a4, #e0e0e0)",
    rain: "linear-gradient(to top right, #667db6, #538ac4, #399bd5, #1daee5, #a8c2e8)",
    snow: "linear-gradient(to top right, #2980b9, #57a2dc, #6dd5fa, #a7e4ff, #ffffff)",
    mist: "linear-gradient(to top right, #757f9a, #8b96b0, #a0adca, #bcc9e5, #e8edf5)",
    thunderstorms: "linear-gradient(to top right, #e9d362, #c6b34e, #a6923b, #6b6640, #857a6a)",
    drizzle: "linear-gradient(to top right, #00d2ff, #2bbae8, #509fd0, #3a7bd5, #85a2cc)",
  };

  // ====== Helper Function to Format Temperature ======
  function formatTemperature(temp) {
    const roundedTemp = Math.round(temp);
    return `${roundedTemp === 0 ? 0 : roundedTemp}°`;
  }

  // ====== Update the User Interface ======
  function updateUI(dataNow, dataForecast) {
    if (!dataNow || !dataForecast) {
      console.error("updateUI called with null data.");
      return;
    }

    // 1) City Name
    $("#result").text(dataNow.name);

    // 2) Current Time
    $("#timeNow").text(getCurrentTimeFormatted(dataNow));

    // 3) Date
    $("#date").text(getCurrentDateFormatted(dataNow));

    // 4) Current Temperature
    if (dataNow.main && dataNow.main.temp !== undefined) {
      $("#currentTemp").text(formatTemperature(dataNow.main.temp));
    }

    // 5) Min and Max Temperature
    $("#tempMin").text(`${formatTemperature(dataNow.main.temp_min)} <`);
    $("#tempMax").text(`< ${formatTemperature(dataNow.main.temp_max)}`);

    // 6) Humidity
    $("#Humidity").text(`Humidity ${dataNow.main.humidity}%`);

    // 7) Wind Speed
    if (units === "metric") {
      let windInKmh = (dataNow.wind.speed * 3.6).toFixed(0);
      $("#windSpeed").text(`${windInKmh} km/h`);
    } else {
      let windInMph = dataNow.wind.speed.toFixed(0);
      $("#windSpeed").text(`${windInMph} mph`);
    }

    // 8) Weather Description and Icon
    $("#Description").text(dataNow.weather[0].description);
    displayWeatherIcon("#iconNow", dataNow.weather[0].description, 100);

    // ====== Change Background Based on Weather ======
    const currentDescription = dataNow.weather[0].description;
    const currentCategory = getWeatherCategory(currentDescription);

    if (currentCategory && categoryBackgrounds[currentCategory]) {
      $("body").css("background-image", categoryBackgrounds[currentCategory]);
    } else {
      $("body").css("background-image", "linear-gradient(to top right, #ffffff, #cccccc)");
    }

    $(".spinner").css("display", "none");
    $(".startOff").css("display", "block");

    // 9) Display Upcoming Hours (3-hour intervals)
    const hourIds = [
      { time: "#3HourTime", temp: "#3HourTemp", icon: "#3HourIcon", index: 0 },
      { time: "#6HourTime", temp: "#6HourTemp", icon: "#6HourIcon", index: 1 },
      { time: "#9HourTime", temp: "#9HourTemp", icon: "#9HourIcon", index: 2 },
      { time: "#12HourTime", temp: "#12HourTemp", icon: "#12HourIcon", index: 3 },
      { time: "#15HourTime", temp: "#15HourTemp", icon: "#15HourIcon", index: 4 },
      { time: "#18HourTime", temp: "#18HourTemp", icon: "#18HourIcon", index: 5 },
    ];

    hourIds.forEach((obj) => {
      let dtTxt = dataForecast.list[obj.index].dt_txt;
      let tempVal = dataForecast.list[obj.index].main.temp;
      let descriptionVal = dataForecast.list[obj.index].weather[0].description;

      // Time
      $(obj.time).text(convertTimeToAmPm(dtTxt, dataNow.timezone));
      // Temperature
      $(obj.temp).text(formatTemperature(tempVal));
      // Icon
      displayWeatherIcon(obj.icon, descriptionVal, 50);
    });
  }

  // ====== Fetch Weather Data by City Name ======
  async function getWeatherDataByCity(city) {
    try {
      let responseNow = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      let dataNow = await responseNow.json();

      let response3Hour = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`
      );
      let data3Hour = await response3Hour.json();

      if (dataNow.cod !== 200) {
        alert(dataNow.message || "City not found");
        return;
      }

      // Store initial metric data
      initialDataNowMetric = dataNow;
      initialDataForecastMetric = data3Hour;

      // Convert if necessary
      if (units === "metric") {
        globalDataNow = JSON.parse(JSON.stringify(initialDataNowMetric));
        globalDataForecast = JSON.parse(JSON.stringify(initialDataForecastMetric));
      } else {
        convertInitialDataToImperial();
      }

      updateUI(globalDataNow, globalDataForecast);
    } catch (error) {
      console.error(error);
    }
  }

  // ====== Fetch Weather Data by Coordinates ======
  async function getWeatherDataByCoords(lat, lon) {
    try {
      let responseNow = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      let dataNow = await responseNow.json();

      let response3Hour = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      let data3Hour = await response3Hour.json();

      // Store initial metric data
      initialDataNowMetric = dataNow;
      initialDataForecastMetric = data3Hour;

      // Convert if necessary
      if (units === "metric") {
        globalDataNow = JSON.parse(JSON.stringify(initialDataNowMetric));
        globalDataForecast = JSON.parse(JSON.stringify(initialDataForecastMetric));
      } else {
        convertInitialDataToImperial();
      }

      updateUI(globalDataNow, globalDataForecast);
    } catch (error) {
      console.error(error);
    }
  }

  // ====== Convert Initial Data to Imperial Units ======
  function convertInitialDataToImperial() {
    if (!initialDataNowMetric || !initialDataForecastMetric) {
      console.error("Initial data not available for conversion.");
      return;
    }

    // Deep copy initial data
    globalDataNow = JSON.parse(JSON.stringify(initialDataNowMetric));
    globalDataForecast = JSON.parse(JSON.stringify(initialDataForecastMetric));

    // Convert temperatures from Celsius to Fahrenheit
    globalDataNow.main.temp = (globalDataNow.main.temp * 9) / 5 + 32;
    globalDataNow.main.temp_min = (globalDataNow.main.temp_min * 9) / 5 + 32;
    globalDataNow.main.temp_max = (globalDataNow.main.temp_max * 9) / 5 + 32;

    globalDataForecast.list.forEach((item) => {
      item.main.temp = (item.main.temp * 9) / 5 + 32;
    });

    // Convert wind speed from m/s to mph
    globalDataNow.wind.speed = globalDataNow.wind.speed * 2.23694;
  }

  // ====== Convert Units and Update UI ======
  function convertUnitsAndUpdateUI() {
    if (units === "metric") {
      if (!initialDataNowMetric || !initialDataForecastMetric) {
        console.error("Initial metric data not available.");
        return;
      }
      globalDataNow = JSON.parse(JSON.stringify(initialDataNowMetric));
      globalDataForecast = JSON.parse(JSON.stringify(initialDataForecastMetric));
    } else if (units === "imperial") {
      convertInitialDataToImperial();
    }

    updateUI(globalDataNow, globalDataForecast);
  }

  // ====== Attempt to Find User's Location on Page Load ======
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        getWeatherDataByCoords(lat, lon);
      },
      () => {
        console.warn("Geolocation not allowed. Fallback to London.");
        getWeatherDataByCity("London");
      }
    );
  } else {
    getWeatherDataByCity("London");
  }

  // ====== Event Handlers ======
  $("#input-city").on("input", function () {
    cityName = $(this).val();
  });

  $("#search-button").on("click", function () {
    handleSearch();
  });

  $("#input-city").on("keypress", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  function handleSearch() {
    if (!cityName) {
      alert("Please enter a city name!");
      return;
    }
    getWeatherDataByCity(cityName);
    $("#input-city").val("").blur();
  }

  // Toggle Celsius/Fahrenheit
  $(".radioButton").on("change", function () {
    if ($(this).attr("id") === "inlineRadio1") {
      units = "metric";
    } else {
      units = "imperial";
    }
    convertUnitsAndUpdateUI();
  });

  // ============ weatherIcons ============
  const svgIcons = {
    clearSky: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <circle cx="50" cy="50" r="10" fill="black" />
        <circle cx="50" cy="20" r="2" fill="black" />
        <circle cx="50" cy="80" r="2" fill="black" />
        <circle cx="20" cy="50" r="2" fill="black" />
        <circle cx="80" cy="50" r="2" fill="black" />
        <circle cx="30" cy="30" r="2" fill="black" />
        <circle cx="70" cy="30" r="2" fill="black" />
        <circle cx="30" cy="70" r="2" fill="black" />
        <circle cx="70" cy="70" r="2" fill="black" />
      </svg>
    `,
    clouds: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <circle cx="30" cy="40" r="10" fill="black" />
        <circle cx="40" cy="40" r="10" fill="black" />
        <circle cx="35" cy="30" r="8" fill="black" />
        <circle cx="47" cy="30" r="9" fill="black" />
        <circle cx="47" cy="30" r="9" fill="black" />
        <circle cx="47" cy="15" r="2" fill="black" />
        <circle cx="62" cy="30" r="2" fill="black" />
        <circle cx="37" cy="20" r="2" fill="black" />
        <circle cx="57" cy="20" r="2" fill="black" />
        <circle cx="57" cy="40" r="2" fill="black" />
      </svg>
    `,
    rain: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <circle cx="30" cy="40" r="10" fill="black" />
        <circle cx="40" cy="40" r="10" fill="black" />
        <circle cx="35" cy="30" r="8" fill="black" />
        <circle cx="30" cy="70" r="2" fill="black" />
        <circle cx="40" cy="80" r="2" fill="black" />
        <circle cx="50" cy="70" r="2" fill="black" />
      </svg>
    `,
    drizzle: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <circle cx="30" cy="40" r="10" fill="black" />
        <circle cx="40" cy="40" r="10" fill="black" />
        <circle cx="35" cy="30" r="8" fill="black" />
        <circle cx="25" cy="70" r="1" fill="black" />
        <circle cx="35" cy="80" r="1" fill="black" />
        <circle cx="45" cy="70" r="1" fill="black" />
        <circle cx="55" cy="80" r="1" fill="black" />
        <circle cx="40" cy="75" r="1" fill="black" />
        <circle cx="50" cy="75" r="1" fill="black" />
        <circle cx="30" cy="75" r="1" fill="black" />
        <circle cx="60" cy="75" r="1" fill="black" />
      </svg>
    `,
    thunderstorms: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <circle cx="30" cy="40" r="10" fill="black" />
        <circle cx="40" cy="40" r="10" fill="black" />
        <circle cx="35" cy="30" r="8" fill="black" />
        <polygon points="30,70 40,90 50,70" fill="black" />
      </svg>
    `,
    mist: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto;">
        <line x1="10" y1="30" x2="75" y2="30" stroke="black" stroke-width="2" />
        <line x1="15" y1="40" x2="75" y2="40" stroke="black" stroke-width="2" stroke-dasharray="10,5,2" />
        <line x1="8" y1="50" x2="80" y2="50" stroke="black" stroke-width="2" />
        <line x1="25" y1="60" x2="75" y2="60" stroke="black" stroke-width="2" stroke-dasharray="6,10,4" />
        <line x1="13" y1="70" x2="70" y2="70" stroke="black" stroke-width="2" />
      </svg>
    `,
    snow: (size) => `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: ${size}px; height: ${size}px; margin: 0 auto; transform: scale(0.5);">
        <defs>
          <marker id="arrow-outward" markerWidth="6" markerHeight="6" refX="1" refY="3" orient="auto">
            <path d="M0,3 L6,0 L6,6 Z" fill="black" />
          </marker>
        </defs>
        <line x1="50" y1="20" x2="50" y2="80" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="50" y1="80" x2="50" y2="20" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="80" y1="50" x2="20" y2="50" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="30" y1="30" x2="70" y2="70" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="70" y1="70" x2="30" y2="30" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="70" y1="30" x2="30" y2="70" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
        <line x1="30" y1="70" x2="70" y2="30" stroke="black" stroke-width="2" marker-end="url(#arrow-outward)" />
      </svg>
    `,
  };

  // ====== Function to Get Weather Category Based on Description ======
  function getWeatherCategory(description) {
    const categoryMap = {
      clearSky: ["clear sky"],
      clouds: [
        "few clouds",
        "scattered clouds",
        "broken clouds",
        "overcast clouds",
      ],
      rain: [
        "light rain",
        "moderate rain",
        "heavy intensity rain",
        "very heavy rain",
        "extreme rain",
        "freezing rain",
        "light intensity shower rain",
        "shower rain",
        "heavy intensity shower rain",
        "ragged shower rain",
      ],
      snow: [
        "light snow",
        "snow",
        "heavy snow",
        "sleet",
        "light shower sleet",
        "shower sleet",
        "light rain and snow",
        "rain and snow",
        "light shower snow",
        "shower snow",
        "heavy shower snow",
      ],
      mist: [
        "mist",
        "smoke",
        "haze",
        "sand/ dust whirls",
        "fog",
        "sand",
        "dust",
        "volcanic ash",
        "squalls",
        "tornado",
      ],
      thunderstorms: [
        "thunderstorm with light rain",
        "thunderstorm with rain",
        "thunderstorm with heavy rain",
        "light thunderstorm",
        "thunderstorm",
        "heavy thunderstorm",
        "ragged thunderstorm",
        "thunderstorm with light drizzle",
        "thunderstorm with drizzle",
        "thunderstorm with heavy drizzle",
      ],
      drizzle: [
        "light intensity drizzle",
        "drizzle",
        "heavy intensity drizzle",
        "light intensity drizzle rain",
        "drizzle rain",
        "heavy intensity drizzle rain",
        "shower rain and drizzle",
        "heavy shower rain and drizzle",
        "shower drizzle",
      ],
    };

    for (const [category, descriptions] of Object.entries(categoryMap)) {
      if (descriptions.includes(description.toLowerCase())) {
        return category;
      }
    }

    return null;
  }

  // ====== Function to Display Corresponding Icon ======
  function displayWeatherIcon(elementId, description, size) {
    const category = getWeatherCategory(description);
    const iconFunc = svgIcons[category];

    if (iconFunc) {
      const iconHTML = iconFunc(size);
      $(elementId).html(iconHTML);
    } else {
      $(elementId).html("<p>No icon available.</p>");
    }
  }
});
// 🦖