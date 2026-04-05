/**
 * Mapeo de códigos de dial a ISO 2 letras para react-phone-input-2
 * Permite convertir códigos como '+52' a 'mx' para el selector de países
 */

export const DIAL_TO_ISO = {
  // América
  '+52': 'mx', // México
  '+1': 'us',  // Estados Unidos
  '+1': 'ca', // Canadá (mismo +1 que US)
  '+34': 'es', // España
  '+57': 'co', // Colombia
  '+54': 'ar', // Argentina
  '+56': 'cl', // Chile
  '+51': 'pe', // Perú
  '+55': 'br', // Brasil
  '+58': 've', // Venezuela
  '+593': 'ec', // Ecuador
  '+503': 'sv', // El Salvador
  '+502': 'gt', // Guatemala
  '+504': 'hn', // Honduras
  '+506': 'cr', // Costa Rica
  '+507': 'pa', // Panamá
  '+598': 'uy', // Uruguay
  '+595': 'py', // Paraguay
  '+591': 'bo', // Bolivia
  '+53': 'cu', // Cuba
  '+599': 'cw', // Curazao
  '+590': 'gp', // Guadalupe
  '+592': 'gy', // Guyana
  '+594': 'gf', // Guayana Francesa
  '+597': 'sr', // Surinam
  '+599': 'bq', // Bonaire
  '+670': 'tl', // Timor-Leste
  '+672': 'nf', // Isla Norfolk
  '+673': 'bn', // Brunéi
  '+674': 'nr', // Nauru
  '+675': 'pg', // Papúa Nueva Guinea
  '+676': 'to', // Tonga
  '+677': 'sb', // Islas Salomón
  '+678': 'vu', // Vanuatu
  '+679': 'fj', // Fiyi
  '+680': 'pw', // Palaos
  '+681': 'wf', // Wallis y Futuna
  '+682': 'ck', // Islas Cook
  '+683': 'nu', // Niue
  '+684': 'as', // Samoa Americana
  '+685': 'ws', // Samoa
  '+686': 'ki', // Kiribati
  '+687': 'nc', // Nueva Caledonia
  '+688': 'tv', // Tuvalu
  '+689': 'pf', // Polinesia Francesa
  '+690': 'tk', // Tokelau
  '+691': 'fm', // Micronesia
  '+692': 'mh', // Islas Marshall
  '+693': 'mp', // Islas Marianas del Norte
  '+694': 'gu', // Guam
  
  // Europa
  '+44': 'gb', // Reino Unido
  '+33': 'fr', // Francia
  '+49': 'de', // Alemania
  '+39': 'it', // Italia
  '+31': 'nl', // Países Bajos
  '+41': 'ch', // Suiza
  '+43': 'at', // Austria
  '+46': 'se', // Suecia
  '+47': 'no', // Noruega
  '+358': 'fi', // Finlandia
  '+45': 'dk', // Dinamarca
  '+351': 'pt', // Portugal
  '+48': 'pl', // Polonia
  '+420': 'cz', // República Checa
  '+36': 'hu', // Hungría
  '+40': 'ro', // Rumanía
  '+30': 'gr', // Grecia
  '+90': 'tr', // Turquía
  '+354': 'is', // Islandia
  '+352': 'lu', // Luxemburgo
  '+353': 'ie', // Irlanda
  '+355': 'al', // Albania
  '+356': 'mt', // Malta
  '+357': 'cy', // Chipre
  '+359': 'bg', // Bulgaria
  '+370': 'lt', // Lituania
  '+371': 'lv', // Letonia
  '+372': 'ee', // Estonia
  '+373': 'md', // Moldavia
  '+374': 'am', // Armenia
  '+375': 'by', // Bielorrusia
  '+376': 'ad', // Andorra
  '+377': 'mc', // Mónaco
  '+378': 'sm', // San Marino
  '+380': 'ua', // Ucrania
  '+381': 'rs', // Serbia
  '+382': 'me', // Montenegro
  '+383': 'xk', // Kosovo
  '+385': 'hr', // Croacia
  '+386': 'si', // Eslovenia
  '+387': 'ba', // Bosnia y Herzegovina
  '+389': 'mk', // Macedonia del Norte
  '+995': 'ge', // Georgia
  
  // Asia y Medio Oriente
  '+81': 'jp', // Japón
  '+82': 'kr', // Corea del Sur
  '+86': 'cn', // China
  '+91': 'in', // India
  '+92': 'pk', // Pakistán
  '+93': 'af', // Afganistán
  '+94': 'lk', // Sri Lanka
  '+880': 'bd', // Bangladés
  '+84': 'vn', // Vietnam
  '+66': 'th', // Tailandia
  '+65': 'sg', // Singapur
  '+63': 'ph', // Filipinas
  '+62': 'id', // Indonesia
  '+60': 'my', // Malasia
  '+972': 'il', // Israel
  '+971': 'ae', // Emiratos Árabes Unidos
  '+966': 'sa', // Arabia Saudita
  '+968': 'om', // Omán
  '+967': 'ye', // Yemen
  '+962': 'jo', // Jordania
  '+963': 'sy', // Siria
  '+964': 'iq', // Irak
  '+965': 'kw', // Kuwait
  '+970': 'ps', // Palestina
  '+973': 'bh', // Baréin
  '+974': 'qa', // Catar
  '+976': 'mn', // Mongolia
  '+977': 'np', // Nepal
  '+975': 'bt', // Bután
  '+992': 'tj', // Tayikistán
  '+993': 'tm', // Turkmenistán
  '+994': 'az', // Azerbaiyán
  '+996': 'kg', // Kirguistán
  '+998': 'uz', // Uzbekistán
  '+7': 'ru', // Rusia
  '+998': 'uz', // Uzbekistán
  '+850': 'kp', // Corea del Norte
  '+852': 'hk', // Hong Kong
  '+853': 'mo', // Macao
  '+855': 'kh', // Camboya
  '+856': 'la', // Laos
  '+95': 'mm', // Myanmar
  '+98': 'ir', // Irán
  '+961': 'lb', // Líbano
  '+969': 'mm', // Myanmar
  
  // África
  '+27': 'za', // Sudáfrica
  '+20': 'eg', // Egipto
  '+234': 'ng', // Nigeria
  '+254': 'ke', // Kenia
  '+213': 'dz', // Argelia
  '+212': 'ma', // Marruecos
  '+216': 'tn', // Túnez
  '+218': 'ly', // Libia
  '+220': 'gm', // Gambia
  '+221': 'sn', // Senegal
  '+222': 'ml', // Malí
  '+223': 'bf', // Burkina Faso
  '+224': 'gn', // Guinea
  '+225': 'ci', // Costa de Marfil
  '+226': 'ne', // Níger
  '+227': 'tg', // Togo
  '+228': 'tg', // Togo
  '+229': 'bj', // Benín
  '+230': 'mu', // Mauricio
  '+231': 'lr', // Liberia
  '+232': 'sl', // Sierra Leona
  '+233': 'gh', // Ghana
  '+235': 'td', // Chad
  '+236': 'cf', // República Centroafricana
  '+237': 'cm', // Camerún
  '+238': 'cv', // Cabo Verde
  '+239': 'st', // Santo Tomé y Príncipe
  '+240': 'gq', // Guinea Ecuatorial
  '+241': 'ga', // Gabón
  '+242': 'cg', // Congo
  '+243': 'cd', // República Democrática del Congo
  '+244': 'ao', // Angola
  '+245': 'gw', // Guinea-Bissau
  '+246': 'io', // Territorio Británico del Océano Índico
  '+247': 'ac', // Isla Ascensión
  '+248': 'sc', // Seychelles
  '+249': 'sd', // Sudán
  '+250': 'rw', // Ruanda
  '+251': 'et', // Etiopía
  '+252': 'so', // Somalia
  '+253': 'dj', // Yibuti
  '+255': 'tz', // Tanzania
  '+256': 'ug', // Uganda
  '+257': 'bi', // Burundi
  '+258': 'mz', // Mozambique
  '+259': 're', // Reunión
  '+260': 'zm', // Zambia
  '+261': 'mg', // Madagascar
  '+262': 're', // Reunión
  '+263': 'zw', // Zimbabue
  '+264': 'na', // Namibia
  '+265': 'mw', // Malaui
  '+266': 'ls', // Lesoto
  '+267': 'bw', // Botsuana
  '+268': 'sz', // Esuatini
  '+269': 'km', // Comoras
  '+290': 'sh', // Santa Elena
  '+291': 'er', // Eritrea
  '+297': 'aw', // Aruba
  '+298': 'fo', // Islas Feroe
  '+299': 'gl', // Groenlandia
  '+350': 'gi', // Gibraltar
  '+351': 'pt', // Portugal
  '+352': 'lu', // Luxemburgo
  '+353': 'ie', // Irlanda
  '+354': 'is', // Islandia
  '+355': 'al', // Albania
  '+356': 'mt', // Malta
  '+357': 'cy', // Chipre
  '+358': 'fi', // Finlandia
  '+359': 'bg', // Bulgaria
  '+370': 'lt', // Lituania
  '+371': 'lv', // Letonia
  '+372': 'ee', // Estonia
  '+373': 'md', // Moldavia
  '+374': 'am', // Armenia
  '+375': 'by', // Bielorrusia
  '+376': 'ad', // Andorra
  '+377': 'mc', // Mónaco
  '+378': 'sm', // San Marino
  '+380': 'ua', // Ucrania
  '+381': 'rs', // Serbia
  '+382': 'me', // Montenegro
  '+383': 'xk', // Kosovo
  '+385': 'hr', // Croacia
  '+386': 'si', // Eslovenia
  '+387': 'ba', // Bosnia y Herzegovina
  '+389': 'mk', // Macedonia del Norte
  
  // Oceanía
  '+61': 'au', // Australia
  '+64': 'nz', // Nueva Zelanda
  '+672': 'nf', // Isla Norfolk
  '+673': 'bn', // Brunéi
  '+674': 'nr', // Nauru
  '+675': 'pg', // Papúa Nueva Guinea
  '+676': 'to', // Tonga
  '+677': 'sb', // Islas Salomón
  '+678': 'vu', // Vanuatu
  '+679': 'fj', // Fiyi
  '+680': 'pw', // Palaos
  '+681': 'wf', // Wallis y Futuna
  '+682': 'ck', // Islas Cook
  '+683': 'nu', // Niue
  '+684': 'as', // Samoa Americana
  '+685': 'ws', // Samoa
  '+686': 'ki', // Kiribati
  '+687': 'nc', // Nueva Caledonia
  '+688': 'tv', // Tuvalu
  '+689': 'pf', // Polinesia Francesa
  '+690': 'tk', // Tokelau
  '+691': 'fm', // Micronesia
  '+692': 'mh', // Islas Marshall
  '+693': 'mp', // Islas Marianas del Norte
  '+694': 'gu', // Guam
  
  // Otros
  '+872': 'gs', // Islas Georgias del Sur y Sandwich del Sur
};

// País por defecto
export const DEFAULT_COUNTRY = 'pe';

// Países preferidos (orden de aparición en el dropdown)
export const PREFERRED_COUNTRIES = ['pe', 'mx', 'us', 'es', 'co', 'ar'];

// Función para normalizar código de país
export const normalizeCountryCode = (countryCode) => {
  // Si ya es ISO 2 letras, usarlo directamente
  if (typeof countryCode === 'string' && countryCode.length === 2 && !countryCode.includes('+')) {
    return countryCode.toLowerCase();
  }
  
  // Si es un dial code, buscar el ISO correspondiente
  if (typeof countryCode === 'string' && countryCode.includes('+')) {
    return DIAL_TO_ISO[countryCode] || DEFAULT_COUNTRY;
  }
  
  // Default
  return DEFAULT_COUNTRY;
};
