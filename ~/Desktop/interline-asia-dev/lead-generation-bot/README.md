# 🤖 Lead Generation Bot #1 - Singapore Travel Industry

Automated lead generation bot that finds travel-related businesses in Singapore using SerpAPI and stores contact information in Supabase.

## 🎯 What It Does

1. **🔍 Searches Google** via SerpAPI for Singapore travel industry websites
2. **📧 Extracts emails** from business websites using smart regex patterns
3. **💾 Stores leads** in Supabase database with deduplication
4. **📊 Tracks performance** with detailed statistics and logging

## 🏢 Target Categories

The bot searches for these types of Singapore travel businesses:

- ✈️ **Travel Agencies** - Holiday packages, vacation planning
- 🚢 **Cruise Specialists** - Cruise booking and packages  
- 👥 **Group Tour Providers** - Guided tours and group travel
- 🛫 **Airlines** - Regional, charter, and international carriers
- 🏛️ **Tourism Boards** - DMCs and destination management
- 🚗 **Car Rental** - Vehicle rental and hire services
- 🏨 **Hotels & Resorts** - Accommodation providers
- 📦 **Travel Wholesalers** - B2B travel consolidators
- 💼 **Corporate Travel** - Business travel and MICE
- 💎 **Luxury Travel** - Premium and high-end travel
- 🏔️ **Adventure Tours** - Outdoor activities and eco tours

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Make sure your `../.env.local` file contains:
```bash
SERPAPI_API_KEY=your_serpapi_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TARGET_COUNTRY=Singapore
```

### 3. Run the Bot
```bash
npm start
```

Or directly:
```bash
node scrape.js
```

## 📊 Expected Output

```
🤖 Starting Lead Generation Bot #1 - Singapore Travel Industry
======================================================================
Target Country: Singapore
Categories: 11
Max results per search: 20

✅ Database connection successful

📂 Processing Category: Travel Agencies
--------------------------------------------------
🔍 Searching: travel agency Singapore site:.sg
   Found 15 Singapore websites
   📧 Scraping: example-travel.com.sg
      ✅ Found 2 business emails
   📧 Scraping: singapore-holidays.com.sg
      ✅ Found 1 business emails

🎯 Lead Generation Complete!
======================================================================
📊 Final Statistics:
   ⏱️  Total time: 245 seconds
   🔍 Searches performed: 33
   🌐 Websites scanned: 127
   📧 Emails found: 89
   💾 Leads inserted: 67
   🔄 Duplicates skipped: 22
   ❌ Errors encountered: 3

✅ Success! 67 new leads added to database.
```

## ⚙️ Configuration

### Search Settings
- **Max results per search**: 20 websites per keyword
- **Request delay**: 2 seconds between SerpAPI calls
- **Scraping delay**: 1 second between website scrapes
- **Timeout**: 15 seconds per website

### Email Filtering
The bot automatically filters emails to find business contacts:

**✅ Includes:**
- contact@, info@, enquiry@, booking@
- Emails matching the website domain
- Business-looking email patterns

**❌ Excludes:**
- noreply@, admin@, webmaster@
- Generic marketing emails
- Invalid email formats

## 📈 Performance Tips

### 1. SerpAPI Limits
- **Free plan**: 100 searches/month
- **Paid plans**: Higher limits available
- Monitor your usage at serpapi.com

### 2. Rate Limiting
- Bot includes built-in delays to respect server limits
- Increase delays if you encounter blocking
- Consider running during off-peak hours

### 3. Optimization
- Start with specific categories that match your business
- Adjust keywords in `scrape.js` for better targeting
- Monitor duplicate rates to assess data quality

## 🛠️ Customization

### Adding New Categories
Edit the `searchCategories` array in `scrape.js`:

```javascript
{
  category: 'Your Category Name',
  keywords: [
    'your keyword Singapore site:.sg',
    'another keyword Singapore site:.sg'
  ]
}
```

### Modifying Search Parameters
Adjust these variables in the config section:
- `maxResultsPerSearch` - Results per keyword
- `requestDelay` - Delay between searches
- `targetCountry` - Change target country

### Email Pattern Customization
Modify the `isBusinessEmail()` function to adjust email filtering logic.

## 🗄️ Database Schema

The bot stores leads in the `leads` table with these fields:

```sql
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  company TEXT,
  website TEXT,
  category TEXT,
  country TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Troubleshooting

### Common Issues

**"SERPAPI_API_KEY not found"**
- Check your `.env.local` file path and content
- Verify the API key is valid at serpapi.com

**"Database connection failed"**
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Check if the `leads` table exists in your database

**"No websites found"**
- Try different keywords or broader search terms
- Check if SerpAPI quota is exceeded
- Verify Singapore (.sg) domains exist for your keywords

**"Access forbidden (403)"**
- Some websites block automated requests
- This is normal - the bot will skip these sites
- Consider adding delays or rotating user agents

### Debug Mode
Add console.log statements to track specific issues:

```javascript
console.log('Debug: Processing website:', website.url);
console.log('Debug: Found emails:', validEmails);
```

## 📊 Success Metrics

Track these KPIs for optimization:
- **Lead generation rate**: Emails found per website
- **Quality score**: Business emails vs total emails
- **Duplicate rate**: New vs existing leads
- **Category performance**: Which categories yield most leads
- **Cost per lead**: SerpAPI costs vs leads generated

## 🔄 Maintenance

### Regular Tasks
- Monitor SerpAPI usage and costs
- Review and update search keywords
- Clean up duplicate or invalid leads
- Analyze category performance

### Weekly Review
```bash
# Check recent leads
SELECT category, COUNT(*) as leads_count 
FROM leads 
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY category;
```

## 🎉 Success Tips

1. **Start small** - Test with 1-2 categories first
2. **Monitor quality** - Check email validity and relevance
3. **Iterate keywords** - Refine based on results
4. **Respect limits** - Don't exceed API quotas
5. **Track ROI** - Monitor cost vs lead quality

---

**Happy lead hunting!** 🎯

For support or questions, check the console output for detailed error messages and statistics.