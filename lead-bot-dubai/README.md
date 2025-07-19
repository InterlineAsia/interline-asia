# Dubai Lead Generation Bot 🤖

**One-command lead generation for Dubai travel industry**

## 🚀 Quick Start

1. **Configure Supabase** (optional - CSV backup always works):
   ```bash
   # Edit .env.local with your Supabase credentials
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

2. **Run the bot**:
   ```bash
   npm start
   ```

That's it! The bot will:
- ✅ Auto-install dependencies
- ✅ Create Supabase table (if configured)
- ✅ Search 6 travel categories in Dubai
- ✅ Extract business emails from company websites
- ✅ Save to Supabase + CSV backup
- ✅ Show clean final summary

## 📊 What It Finds

**6 Travel Categories:**
- Airlines (Emirates, FlyDubai, etc.)
- Travel Associations
- Tourism Boards  
- Car Rental Companies
- Hotels & Resorts
- Travel Wholesalers

**Output Files:**
- `output/leads_dubai.csv` (always created)
- Supabase `leads_dubai` table (if configured)

## 🛡️ Built-in Safety

- Skips social media (Facebook, LinkedIn, etc.)
- Filters generic emails (info@, admin@, etc.)
- 2.5 second delays between requests
- Retry logic for failed requests
- CSV backup always works (even if Supabase fails)

## 📈 Expected Results

Typically finds 30-100 qualified business email contacts from Dubai travel companies.

---

**Just run `npm start` and let it work! 🎯**