# CSV Upload + Gemini Processing System

## Overview
This system allows weekly upload of cruise deals CSV files with automated processing using Google Gemini AI for data cleaning and categorization.

## Features
- **Drag & Drop Interface**: Modern upload interface at `/upload`
- **CSV Validation**: File type and size validation (max 10MB)
- **Gemini Processing**: Automated data cleaning and categorization
- **Batch Processing**: Handles large CSV files in batches to respect API limits
- **JSON Export**: Download processed data as clean JSON
- **Admin Integration**: Accessible from the admin panel

## Setup Instructions

### 1. Environment Variables
Add your Google API key to your `.env` file:
```
GOOGLE_API_KEY=AIzaSy...your_actual_key_here
```

### 2. Vercel Deployment
The system is configured for Vercel with:
- Static frontend files
- Serverless API endpoint at `/api/process-csv`
- Automatic CORS handling

### 3. Access
- Navigate to `/upload` (admin authentication required)
- Or click "CSV Upload" button in the admin panel

## Usage

### 1. Upload CSV
- Drag and drop or click to select a CSV file
- File must be .csv format and under 10MB
- System validates file before processing

### 2. Processing
- Click "Process CSV with Gemini"
- System reads CSV and sends to Gemini API in batches
- Progress bar shows processing status

### 3. Results
- View processed JSON data in the preview
- Download cleaned data as JSON file
- Data includes standardized fields and categorization

## CSV Format
The system can process any CSV format. Gemini will:
- Standardize cruise line names
- Parse and format dates (YYYY-MM-DD)
- Categorize regions (Caribbean, Mediterranean, etc.)
- Clean pricing data
- Structure itineraries
- Add missing fields with defaults

## Example Input CSV
```csv
cruise_line,ship_name,departure_date,region,nights,departure_port,arrival_port,itinerary,inside_price,oceanview_price,balcony_price,suite_price
Royal Caribbean,Wonder of the Seas,2025-07-15,Caribbean,7,Miami,Miami,"Miami - Cozumel - Roatan - Costa Maya - Miami",1299,1599,2199,3999
```

## Example Output JSON
```json
[
  {
    "id": "unique_id_here",
    "cruiseLine": "Royal Caribbean",
    "shipName": "Wonder of the Seas",
    "departureDate": "2025-07-15",
    "region": "Caribbean",
    "nights": 7,
    "departurePort": "Miami",
    "arrivalPort": "Miami",
    "itinerary": "Miami - Cozumel - Roatan - Costa Maya - Miami",
    "cabinTypes": {
      "inside": 1299,
      "oceanview": 1599,
      "balcony": 2199,
      "suite": 3999
    },
    "originalData": { /* original CSV row */ },
    "processedAt": "2024-01-15T10:30:00Z"
  }
]
```

## Security Features
- Admin authentication required
- Google API key stored securely in environment variables
- CORS protection
- File type and size validation
- Rate limiting between API calls

## Error Handling
- File validation errors
- API connection errors
- Gemini processing errors
- JSON parsing errors
- User-friendly error messages

## Future Enhancements
- Direct integration with existing deals database
- Automatic scheduling for weekly uploads
- Email notifications on processing completion
- Advanced filtering and preview options
- Integration with existing admin filtering system

## Files Created
- `upload.html` - Frontend upload interface
- `api/process-csv.js` - Serverless API endpoint
- Updated `vercel.json` - Deployment configuration
- Updated `admin.html` - Added CSV upload link
- Updated `.env.example` - Added GOOGLE_API_KEY

## Testing
Use the test CSV file `tmp_rovodev_test_csv.csv` to verify the system works correctly.