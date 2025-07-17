// Sample cruise data for the Cruise Helper Bot
const cruiseData = [
  {
    id: 1,
    cruise_line: "Royal Caribbean",
    ship_name: "Wonder of the Seas",
    duration: 7,
    departure_date: "2025-09-15",
    departure_port: "Barcelona, Spain",
    arrival_port: "Rome (Civitavecchia), Italy",
    region: "Mediterranean",
    itinerary: "Barcelona, Spain; Palma de Mallorca, Spain; Provence (Marseille), France; Florence/Pisa (La Spezia), Italy; Rome (Civitavecchia), Italy",
    price_usd: 1299,
    image_url: "https://www.royalcaribbean.com/content/dam/royal/ships/wonder-of-the-seas/wonder-of-the-seas-exterior-sunset.jpg"
  },
  {
    id: 2,
    cruise_line: "Norwegian Cruise Line",
    ship_name: "Norwegian Prima",
    duration: 10,
    departure_date: "2025-10-20",
    departure_port: "Miami, Florida",
    arrival_port: "Miami, Florida",
    region: "Caribbean",
    itinerary: "Miami, Florida; Roatan, Honduras; Harvest Caye, Belize; Costa Maya, Mexico; Cozumel, Mexico; Miami, Florida",
    price_usd: 1899,
    image_url: "https://www.ncl.com/sites/default/files/Prima_Exterior_Hub_1920x1080_0.jpg"
  },
  {
    id: 3,
    cruise_line: "Celebrity Cruises",
    ship_name: "Celebrity Solstice",
    duration: 14,
    departure_date: "2025-11-05",
    departure_port: "Singapore",
    arrival_port: "Tokyo, Japan",
    region: "Asia",
    itinerary: "Singapore; Bangkok (Laem Chabang), Thailand; Ho Chi Minh City (Phu My), Vietnam; Hong Kong, China; Taipei (Keelung), Taiwan; Nagasaki, Japan; Tokyo, Japan",
    price_usd: 2499,
    image_url: "https://www.celebritycruises.com/content/dam/celebrity/ships/celebrity-solstice/celebrity-solstice-exterior-1.jpg"
  },
  {
    id: 4,
    cruise_line: "Princess Cruises",
    ship_name: "Majestic Princess",
    duration: 12,
    departure_date: "2025-12-10",
    departure_port: "Sydney, Australia",
    arrival_port: "Auckland, New Zealand",
    region: "Australia",
    itinerary: "Sydney, Australia; Melbourne, Australia; Hobart, Tasmania; Fiordland National Park, New Zealand; Dunedin, New Zealand; Christchurch, New Zealand; Wellington, New Zealand; Auckland, New Zealand",
    price_usd: 2199,
    image_url: "https://www.princess.com/images/ships/mj/Majestic-Princess-Ship.jpg"
  },
  {
    id: 5,
    cruise_line: "MSC Cruises",
    ship_name: "MSC Virtuosa",
    duration: 7,
    departure_date: "2026-01-15",
    departure_port: "Dubai, UAE",
    arrival_port: "Dubai, UAE",
    region: "Middle East",
    itinerary: "Dubai, UAE; Abu Dhabi, UAE; Sir Bani Yas Island, UAE; Muscat, Oman; Khasab, Oman; Dubai, UAE",
    price_usd: 1499,
    image_url: "https://www.msccruises.com/content/dam/msc/ships/msc-virtuosa/ship-details/MSC-Virtuosa-ship-profile.jpg"
  }
];

// Add 195 more sample cruises with variations
for (let i = 6; i <= 200; i++) {
  const regions = ["Mediterranean", "Caribbean", "Asia", "Alaska", "Europe", "South America", "Australia", "Middle East", "Hawaii", "Africa"];
  const cruiseLines = ["Royal Caribbean", "Norwegian Cruise Line", "Celebrity Cruises", "Princess Cruises", "MSC Cruises", "Carnival Cruise Line", "Holland America Line", "Costa Cruises", "Disney Cruise Line", "Cunard Line"];
  const ports = {
    "Mediterranean": ["Barcelona, Spain", "Rome (Civitavecchia), Italy", "Athens (Piraeus), Greece", "Venice, Italy", "Istanbul, Turkey"],
    "Caribbean": ["Miami, Florida", "Fort Lauderdale, Florida", "San Juan, Puerto Rico", "Bridgetown, Barbados", "Nassau, Bahamas"],
    "Asia": ["Singapore", "Tokyo, Japan", "Hong Kong, China", "Shanghai, China", "Bangkok (Laem Chabang), Thailand"],
    "Alaska": ["Seattle, Washington", "Vancouver, British Columbia", "Anchorage (Seward), Alaska", "Juneau, Alaska", "Whittier, Alaska"],
    "Europe": ["Southampton, UK", "Copenhagen, Denmark", "Amsterdam, Netherlands", "Stockholm, Sweden", "Hamburg, Germany"],
    "South America": ["Buenos Aires, Argentina", "Rio de Janeiro, Brazil", "Santiago (San Antonio), Chile", "Lima (Callao), Peru", "Montevideo, Uruguay"],
    "Australia": ["Sydney, Australia", "Melbourne, Australia", "Brisbane, Australia", "Auckland, New Zealand", "Perth (Fremantle), Australia"],
    "Middle East": ["Dubai, UAE", "Abu Dhabi, UAE", "Doha, Qatar", "Muscat, Oman", "Aqaba, Jordan"],
    "Hawaii": ["Honolulu, Hawaii", "Kahului, Maui", "Hilo, Hawaii", "Nawiliwili, Kauai", "Kona, Hawaii"],
    "Africa": ["Cape Town, South Africa", "Port Louis, Mauritius", "Mombasa, Kenya", "Durban, South Africa", "Zanzibar, Tanzania"]
  };
  
  const randomRegion = regions[Math.floor(Math.random() * regions.length)];
  const randomCruiseLine = cruiseLines[Math.floor(Math.random() * cruiseLines.length)];
  const randomDuration = Math.floor(Math.random() * 14) + 3; // 3 to 16 days
  const randomPrice = Math.floor(Math.random() * 3000) + 800; // $800 to $3800
  
  const departurePort = ports[randomRegion][Math.floor(Math.random() * ports[randomRegion].length)];
  const arrivalPort = ports[randomRegion][Math.floor(Math.random() * ports[randomRegion].length)];
  
  // Generate a random date in 2025-2026
  const randomMonth = Math.floor(Math.random() * 24) + 1; // 1 to 24 months from now
  const departureDate = new Date();
  departureDate.setMonth(departureDate.getMonth() + randomMonth);
  
  cruiseData.push({
    id: i,
    cruise_line: randomCruiseLine,
    ship_name: `${randomCruiseLine} ${["Explorer", "Voyager", "Adventure", "Dream", "Fantasy", "Majesty", "Splendor", "Harmony", "Serenity", "Odyssey"][Math.floor(Math.random() * 10)]}`,
    duration: randomDuration,
    departure_date: departureDate.toISOString().split('T')[0],
    departure_port: departurePort,
    arrival_port: arrivalPort,
    region: randomRegion,
    itinerary: `${departurePort}; Various Ports; ${arrivalPort}`,
    price_usd: randomPrice,
    image_url: "https://example.com/cruise-ship.jpg"
  });
}