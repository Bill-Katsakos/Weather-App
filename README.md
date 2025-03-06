# Weather App

## Description

The **Weather App** is a web application that allows users to select a city and view real-time weather information. It provides data such as:

- Temperature (with the option to choose between metric and imperial units)
- Humidity
- Wind speed
- Weather condition (e.g., clear sky, cloudy, etc.)
- Date and time of the selected city

The app offers 6 forecasts every three hours and dynamically adjusts its background to match the weather conditions.

## Features

- City selection for weather display
- Detailed weather data presentation
- Option to switch between metric and imperial units
- 6 forecasts every three hours
- Dynamic background changes based on weather conditions
- Custom-made SVG icons

## Installation & Usage

To run the app locally in **VS Code**, you will need the following extensions:

- **Live Sass Compiler**
- **Live Server**

### Steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/Bill-Katsakos/Weather-App.git
   ```
2. Open the project in VS Code.
3. Add your own API key from **[OpenWeatherMap](https://openweathermap.org/)** by modifying line 3 in the script:
   ```javascript
   const apiKey = '<API>';
   ```
4. Enable **Live Sass Compiler** to convert `.scss` files into CSS.
5. Start **Live Server** to preview the app in your browser.

## Technologies Used

- **HTML**
- **CSS (SASS)**
- **Bootstrap**
- **JavaScript**
- **jQuery**

## API

The application uses the **[OpenWeatherMap API](https://openweathermap.org/)** to retrieve weather data.

## Contribution

Contributions are welcome! If you’d like to contribute:

1. Fork the repository.
2. Create a new branch.
3. Submit a pull request.

## License

This project is open-source under the **Creative Commons Attribution License**. If you use or modify this project, you must provide proper credit to the original author.

## Acknowledgments

This project was developed as part of the **Social Hackers Academy Bootcamp**.

🦖
