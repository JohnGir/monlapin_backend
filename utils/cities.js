const ivoirianCities = {
  'Abidjan': { coordinates: [-4.008, 5.320], region: 'Lagunes' },
  'Yamoussoukro': { coordinates: [-5.276, 6.827], region: 'Lacs' },
  'Bouaké': { coordinates: [-5.030, 7.690], region: 'Vallée du Bandama' },
  'Daloa': { coordinates: [-6.450, 6.883], region: 'Sassandra-Marahoué' },
  'Korhogo': { coordinates: [-5.630, 9.450], region: 'Savanes' },
  'San-Pédro': { coordinates: [-6.633, 4.733], region: 'Bas-Sassandra' },
  'Abengourou': { coordinates: [-3.483, 6.733], region: 'Comoé' },
  'Man': { coordinates: [-7.400, 7.400], region: 'Montagnes' },
  'Divo': { coordinates: [-5.350, 5.783], region: 'Lôh-Djiboua' },
  'Gagnoa': { coordinates: [-5.950, 6.133], region: 'Gôh-Djiboua' },
  'Anyama': { coordinates: [-3.900, 5.500], region: 'Abidjan' },
  'Agboville': { coordinates: [-4.217, 5.933], region: 'Agnéby-Tiassa' },
  'Grand-Bassam': { coordinates: [-3.733, 5.200], region: 'Comoé' },
  'Bingerville': { coordinates: [-3.883, 5.350], region: 'Abidjan' },
  'Adzopé': { coordinates: [-3.867, 6.100], region: 'La Mé' }
};

const getCityCoordinates = (cityName) => {
  const normalizedCity = Object.keys(ivoirianCities).find(
    city => city.toLowerCase() === cityName.toLowerCase()
  );
  return ivoirianCities[normalizedCity] || ivoirianCities['Abidjan'];
};

const isValidIvoirianCity = (cityName) => {
  return Object.keys(ivoirianCities).some(
    city => city.toLowerCase() === cityName.toLowerCase()
  );
};

module.exports = {
  ivoirianCities,
  getCityCoordinates,
  isValidIvoirianCity
};