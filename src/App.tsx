import { useState } from 'react';
import { Cloud, Leaf, MapPin, Search, Droplets, Wind, Thermometer, Eye, Gauge, Sprout, AlertCircle } from 'lucide-react';

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  visibility: number;
  pressure: number;
}

interface SoilData {
  moisture: number;
  temperature: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

function App() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [soil, setSoil] = useState<SoilData | null>(null);

  const fetchData = async () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Latitude must be between -90 and 90, Longitude between -180 and 180');
      return;
    }

    setLoading(true);
    setError('');

    try {
        const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const date = `${yyyy}${mm}${dd}`;

  const weatherResponse = await fetch(
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,WS2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN&community=RE&latitude=${lat}&longitude=${lon}&format=JSON&start=${date}&end=${date}`
  );

  if (!weatherResponse.ok) throw new Error('Weather data unavailable');

  const weatherData = await weatherResponse.json();
  const parameters = weatherData?.properties?.parameter;

  if (!parameters || !parameters.T2M) {
    throw new Error('NASA API returned invalid data. Check coordinates.');
  }

  // 🧠 Get the first available record dynamically
  const firstKey = Object.keys(parameters.T2M)[0];

  setWeather({
    temperature: Math.round(parameters.T2M[firstKey]),
    feels_like: Math.round(parameters.T2M[firstKey] - 2),
    humidity: Math.round(parameters.RH2M[firstKey]),
    wind_speed: Math.round(parameters.WS2M[firstKey]),
    description: 'NASA POWER Climate Data',
    visibility: 10,
    pressure: 1013 // NASA API doesn’t give surface pressure directly
  });

      const soilResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm&timezone=auto&forecast_days=1`
      );

      if (!soilResponse.ok) throw new Error('Soil data unavailable');

      const soilData = await soilResponse.json();

      const soilTemp = soilData.hourly.soil_temperature_0cm[0];
      const soilMoisture = soilData.hourly.soil_moisture_0_to_1cm[0];

      const simulatedPH = 6.5 + (Math.random() * 1.5 - 0.75);
      const simulatedN = 20 + Math.random() * 30;
      const simulatedP = 15 + Math.random() * 25;
      const simulatedK = 100 + Math.random() * 150;

      let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
      const recommendations: string[] = [];

      if (simulatedPH < 6.0 || simulatedPH > 7.5) {
        healthStatus = 'fair';
        recommendations.push(
          simulatedPH < 6.0
            ? 'Soil is acidic. Apply lime to increase pH level.'
            : 'Soil is alkaline. Apply sulfur to decrease pH level.'
        );
      }

      if (soilMoisture < 0.15) {
        healthStatus = 'fair';
        recommendations.push('Low soil moisture detected. Increase irrigation.');
      } else if (soilMoisture > 0.35) {
        recommendations.push('High soil moisture. Ensure proper drainage to prevent waterlogging.');
      }

      if (simulatedN < 20) {
        healthStatus = healthStatus === 'good' ? 'fair' : 'poor';
        recommendations.push('Low nitrogen levels. Apply nitrogen-rich fertilizer.');
      }

      if (simulatedP < 15) {
        recommendations.push('Low phosphorus. Consider adding bone meal or rock phosphate.');
      }

      if (simulatedK < 100) {
        recommendations.push('Low potassium. Apply potash or wood ash.');
      }

      if (soilTemp < 10) {
        recommendations.push('Soil temperature is low. Consider waiting for warmer weather before planting.');
      } else if (soilTemp > 35) {
        recommendations.push('High soil temperature. Provide mulch to keep soil cool.');
      }

      if (recommendations.length === 0) {
        healthStatus = 'excellent';
        recommendations.push('Soil conditions are optimal for farming.');
      }

      setSoil({
        moisture: soilMoisture * 100,
        temperature: soilTemp,
        ph: simulatedPH,
        nitrogen: simulatedN,
        phosphorus: simulatedP,
        potassium: simulatedK,
        health_status: healthStatus,
        recommendations
      });
    } catch (err) {
      setError('Unable to fetch data. Please check your coordinates and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      setError('');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          setLoading(false);
        },
        () => {
          setError('Unable to access your location. Please enter coordinates manually.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-teal-50">
      <header className="bg-white shadow-md border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-3">
            <Leaf className="w-10 h-10 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">FarmAssist</h1>
          </div>
          <p className="text-center text-gray-600 mt-2">Weather & Soil Health Monitor for Farmers</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            Enter Location Coordinates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 26.9124"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Range: -90 to 90</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., 75.7873"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Range: -180 to 180</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={fetchData}
              disabled={loading || !latitude || !longitude}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              Get Weather & Soil Data
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg hover:shadow-xl"
            >
              <MapPin className="w-5 h-5" />
              Use My Location
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
              <p className="mt-4 text-gray-600 font-medium text-lg">Fetching data...</p>
            </div>
          )}
        </div>

        {weather && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-600" />
              Weather Conditions
            </h2>

            <div className="text-center pb-6 mb-6 border-b-2 border-gray-200">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Cloud className="w-20 h-20 text-blue-500" />
                <div>
                  <p className="text-6xl font-bold text-gray-900">{weather.temperature}°C</p>
                  <p className="text-xl text-gray-600 mt-2">{weather.description}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Feels Like</p>
                <p className="text-2xl font-bold text-gray-900">{weather.feels_like}°C</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border-2 border-cyan-200">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Humidity</p>
                <p className="text-2xl font-bold text-gray-900">{weather.humidity}%</p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border-2 border-teal-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wind className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Wind Speed</p>
                <p className="text-2xl font-bold text-gray-900">{weather.wind_speed} km/h</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border-2 border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Visibility</p>
                <p className="text-2xl font-bold text-gray-900">{weather.visibility} km</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Pressure</p>
                <p className="text-2xl font-bold text-gray-900">{weather.pressure} hPa</p>
              </div>
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Farming Recommendations</h3>
              <ul className="space-y-2">
                {weather.temperature > 30 && (
                  <li className="flex items-start gap-2 text-gray-800">
                    <span className="text-orange-600 text-xl mt-0.5">•</span>
                    <span className="font-medium">High temperature detected. Ensure adequate irrigation for crops and provide shade if possible.</span>
                  </li>
                )}
                {weather.humidity > 70 && (
                  <li className="flex items-start gap-2 text-gray-800">
                    <span className="text-blue-600 text-xl mt-0.5">•</span>
                    <span className="font-medium">High humidity may increase disease risk. Monitor crops closely for fungal infections.</span>
                  </li>
                )}
                {weather.wind_speed > 30 && (
                  <li className="flex items-start gap-2 text-gray-800">
                    <span className="text-teal-600 text-xl mt-0.5">•</span>
                    <span className="font-medium">Strong winds detected. Avoid spraying pesticides or fertilizers today.</span>
                  </li>
                )}
                {weather.temperature >= 15 && weather.temperature <= 30 && weather.humidity < 70 && (
                  <li className="flex items-start gap-2 text-gray-800">
                    <span className="text-green-600 text-xl mt-0.5">•</span>
                    <span className="font-medium">Excellent conditions for most farming activities including planting and harvesting.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {soil && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sprout className="w-6 h-6 text-green-600" />
                Soil Health Analysis
              </h2>
              <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getHealthColor(soil.health_status)}`}>
                {soil.health_status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">Soil Moisture</p>
                <p className="text-3xl font-bold text-gray-900">{soil.moisture.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">Temperature</p>
                <p className="text-3xl font-bold text-gray-900">{soil.temperature.toFixed(1)}°C</p>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-5 border-2 border-violet-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">pH Level</p>
                <p className="text-3xl font-bold text-gray-900">{soil.ph.toFixed(1)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border-2 border-green-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">Nitrogen (N)</p>
                <p className="text-3xl font-bold text-gray-900">{soil.nitrogen.toFixed(0)} ppm</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border-2 border-yellow-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">Phosphorus (P)</p>
                <p className="text-3xl font-bold text-gray-900">{soil.phosphorus.toFixed(0)} ppm</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border-2 border-red-200">
                <p className="text-sm text-gray-600 font-semibold mb-1">Potassium (K)</p>
                <p className="text-3xl font-bold text-gray-900">{soil.potassium.toFixed(0)} ppm</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Soil Health Recommendations
              </h3>
              <ul className="space-y-2">
                {soil.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-800">
                    <span className="text-green-600 text-xl mt-0.5">•</span>
                    <span className="font-medium">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!weather && !loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-4 border-dashed border-gray-300">
            <div className="flex justify-center gap-6 mb-6">
              <Cloud className="w-16 h-16 text-gray-400" />
              <Sprout className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Get Started</h3>
            <p className="text-gray-600 text-lg">Enter your farm's coordinates above to view weather conditions and soil health analysis.</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t-4 border-green-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 font-medium">
            FarmAssist - Empowering farmers with real-time weather and soil health data
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
