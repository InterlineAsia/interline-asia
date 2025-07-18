# 🚀 Interline Asia Lead Generation System

Automated lead generation and email outreach system for finding travel industry partnerships.

## 🎯 What It Does

1. **🔍 Domain Discovery** - Uses SerpAPI to find travel industry websites
2. **📧 Email Extraction** - Scrapes contact emails from travel company websites  
3. **💾 Lead Storage** - Stores leads in Supabase database with deduplication
4. **📬 Email Outreach** - Sends personalized partnership emails via Brevo
5. **📊 Analytics** - Tracks campaign performance and lead status

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd lead-generation
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your API keys:
- **SUPABASE_SERVICE_ROLE_KEY** - From Supabase dashboard
- **SERPAPI_KEY** - From serpapi.com (for Google search)
- **BREVO_API_KEY** - From brevo.com (for email sending)

### 3. Database Setup
The system will automatically create the required `leads` table, or you can create it manually:

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  contact_name TEXT,
  phone_number TEXT,
  company_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'bounced', 'replied', 'unsubscribed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  last_contacted TIMESTAMP WITH TIME ZONE
);
```

## 🚀 Usage

### Run Full Campaign
```bash
npm start
```

This will:
1. Search for travel industry domains
2. Scrape emails from those domains
3. Store new leads in database
4. Send partnership emails to new leads

### Run Follow-up Campaign
```bash
npm start -- --follow-up
```

This will only send emails to existing pending leads in your database.

### Development Mode
```bash
npm run dev
```

Runs with auto-restart when files change.

## 📊 Campaign Results

The system provides detailed analytics:

- **Domain Discovery**: Number of travel websites found
- **Email Extraction**: Contact emails discovered per domain
- **Lead Storage**: New vs duplicate leads
- **Email Campaign**: Send success rates and failures
- **Database Stats**: Total leads by status

## 🎯 Email Template

The system sends professional partnership emails with:

- ✅ Personalized subject lines
- ✅ Company-specific content
- ✅ Clear value proposition
- ✅ Professional HTML formatting
- ✅ Unsubscribe compliance
- ✅ Tracking headers

## 🔧 Configuration Options

### Search Settings
- `SEARCH_KEYWORDS` - Industry terms to search for
- `SEARCH_DOMAINS` - Specific domains to search within
- `MAX_DOMAINS_PER_SEARCH` - Limit domains processed
- `MAX_EMAILS_PER_DOMAIN` - Limit emails per website

### Rate Limiting
- `REQUESTS_PER_MINUTE` - Web scraping rate limit
- `EMAILS_PER_HOUR` - Email sending rate limit

### Email Settings
- `BREVO_SENDER_EMAIL` - Your sender email address
- `BREVO_SENDER_NAME` - Your sender name

## 📈 Best Practices

### 1. Start Small
- Begin with 10-20 domains to test
- Monitor email deliverability
- Adjust templates based on responses

### 2. Respect Rate Limits
- Don't exceed API quotas
- Space out campaigns (weekly/monthly)
- Monitor bounce rates

### 3. Compliance
- Include unsubscribe links
- Honor opt-out requests
- Follow CAN-SPAM guidelines
- Respect robots.txt files

### 4. Quality Over Quantity
- Target relevant travel businesses
- Personalize email content
- Follow up with interested prospects

## 🛡️ Safety Features

- ✅ **Duplicate Prevention** - Avoids emailing same contact twice
- ✅ **Rate Limiting** - Respects API and server limits
- ✅ **Error Handling** - Graceful failure recovery
- ✅ **Status Tracking** - Monitors email delivery status
- ✅ **Unsubscribe Support** - Compliance with email regulations

## 📞 Support

For issues or questions:
- Check the console output for detailed error messages
- Verify API keys and database connections
- Monitor rate limits and quotas
- Review email deliverability settings

## 🔄 Maintenance

### Regular Tasks
- Clean up old bounced leads
- Update email templates
- Monitor campaign performance
- Refresh search keywords

### Database Cleanup
```bash
# Remove old bounced leads (90+ days)
npm start -- --cleanup
```

## 📋 Troubleshooting

### Common Issues

**"Database connection failed"**
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Verify database permissions

**"No domains found"**
- Check SERPAPI_KEY validity
- Verify search keywords are relevant
- Check API quota limits

**"Email sending failed"**
- Verify BREVO_API_KEY
- Check sender email verification
- Monitor account limits

**"Rate limit exceeded"**
- Reduce REQUESTS_PER_MINUTE
- Increase delays between operations
- Check API quotas

## 🎉 Success Metrics

Track these KPIs:
- **Lead Generation Rate** - Emails found per domain
- **Email Deliverability** - Successful sends vs bounces
- **Response Rate** - Replies received
- **Conversion Rate** - Partnerships established
- **Cost Per Lead** - API costs vs leads generated

---

**Happy lead generation!** 🚀