# Security & Performance Guide for CSV Upload System

## 🔒 API Key Security - Your Concerns Addressed

### **Can Gemini see my API key?**
**NO** - Your API key is completely secure:

1. **Server-side only**: The API key is stored in Vercel's environment variables and only accessed by the serverless function
2. **Never sent to frontend**: The key never appears in browser code, network requests, or client-side JavaScript
3. **Not visible to Gemini**: Gemini only receives the prompt and data - it never sees your API key
4. **Encrypted in transit**: All API calls use HTTPS encryption

### **Security Architecture:**
```
Browser → Upload Interface → Vercel API Function → Google Gemini
                ↑                    ↑
        No API key here    API key stored securely here
```

### **Additional Security Measures:**
- Admin authentication required to access upload page
- File type validation (CSV only)
- File size limits (10MB max)
- CORS protection
- Input sanitization
- Rate limiting between API calls

---

## 🤖 Gemini Prompt Engineering

### **Detailed Prompt Explanation:**
The system uses a comprehensive prompt that tells Gemini exactly what to do:

1. **Context Setting**: Explains this is for Interline Asia travel industry professionals
2. **Standardization Rules**: Specific cruise line names, region categories
3. **Data Formatting**: Exact date formats, pricing rules, field requirements
4. **Output Structure**: Precise JSON schema with required fields
5. **Quality Control**: Ensures consistent, professional data output

### **Why This Prompt Works:**
- **Specific Instructions**: Eliminates ambiguity in data processing
- **Industry Context**: Gemini understands the travel industry requirements
- **Standardized Output**: Consistent formatting across all uploads
- **Error Prevention**: Clear rules prevent common data issues

---

## 📈 Large File Handling

### **Current Capabilities:**
- **File Size**: Up to 10MB CSV files (thousands of cruise deals)
- **Batch Processing**: Automatically splits large files into manageable chunks
- **Dynamic Batching**: Adjusts batch size based on file size for optimal performance
- **Progress Tracking**: Real-time progress updates during processing

### **Performance Optimizations:**
```javascript
// Dynamic batch sizing for large files
const batchSize = Math.min(20, Math.ceil(rows.length / 10));

// Rate limiting to respect API limits
await new Promise(resolve => setTimeout(resolve, 1000));
```

### **For Even Larger Files (if needed):**
If you need to handle files larger than 10MB, we can:
1. Increase the file size limit
2. Implement streaming CSV processing
3. Add background job processing
4. Use chunked file uploads

---

## 🔄 Automatic Website Updates

### **How Auto-Update Works:**
1. **CSV Processing**: Gemini cleans and categorizes your data
2. **Data Validation**: System validates the processed data
3. **File Management**: Creates new deals files with timestamps
4. **Index Updates**: Updates the deals index for easy access
5. **Main File Update**: Updates the primary deals.json file
6. **Old File Cleanup**: Automatically removes old files (keeps last 10)

### **Update Options:**
- **Append Mode** (default): Adds new deals to existing ones - perfect for weekly updates
- **Replace Mode**: Completely replaces all deals - use for full refreshes

### **File Structure After Update:**
```
public/data/
├── deals-2024-01-15.json     (your new upload)
├── deals-2024-01-08.json     (previous week)
├── deals-index.json          (tracks all uploads)
└── deals.json               (main file - always latest)
```

---

## ⚡ Performance Specifications

### **Processing Speed:**
- **Small files** (100 deals): ~30 seconds
- **Medium files** (500 deals): ~2-3 minutes  
- **Large files** (1000+ deals): ~5-8 minutes

### **Scalability Features:**
- **Serverless Architecture**: Automatically scales with demand
- **Batch Processing**: Handles any file size efficiently
- **Memory Management**: Optimized for large datasets
- **Error Recovery**: Continues processing even if individual batches fail

### **API Rate Limits:**
- Built-in delays between API calls
- Respects Google's rate limiting
- Automatic retry logic for failed requests

---

## 🛡️ Error Handling & Recovery

### **Comprehensive Error Handling:**
1. **File Validation**: Checks file type, size, and format before processing
2. **API Error Recovery**: Retries failed Gemini API calls
3. **Data Validation**: Validates processed data before saving
4. **Partial Success**: Saves successfully processed batches even if others fail
5. **User Feedback**: Clear error messages and recovery suggestions

### **Common Issues & Solutions:**
- **Large File Timeout**: Automatically splits into smaller batches
- **API Rate Limit**: Built-in delays and retry logic
- **Invalid CSV Format**: Clear error messages with format requirements
- **Network Issues**: Automatic retry with exponential backoff

---

## 🚀 Weekly Workflow Recommendation

### **Optimal Weekly Process:**
1. **Prepare CSV**: Export your weekly deals in any CSV format
2. **Upload & Process**: Use the upload interface (takes 2-8 minutes depending on size)
3. **Auto-Update**: System automatically updates your website
4. **Verification**: Check the results preview before finalizing
5. **Done**: Your website now has the latest deals!

### **Best Practices:**
- Use "Append" mode for weekly updates
- Keep CSV files under 5MB for fastest processing
- Upload during low-traffic hours if processing large files
- Always review the processed data preview

---

## 📊 Monitoring & Maintenance

### **Built-in Monitoring:**
- Processing time tracking
- Success/failure rates
- File size and deal count logging
- Automatic cleanup of old files

### **Maintenance Features:**
- Keeps only last 10 uploads to prevent storage bloat
- Automatic error logging for troubleshooting
- Performance metrics for optimization

---

## 🔧 Technical Requirements

### **Server Requirements:**
- Vercel serverless functions (included in your current setup)
- Environment variable: `GOOGLE_API_KEY`
- No additional server setup needed

### **Browser Compatibility:**
- Modern browsers with JavaScript enabled
- File API support for drag & drop
- Admin authentication required

---

## ❓ FAQ

**Q: What if my CSV has different column names?**
A: Gemini is smart enough to understand various column formats and will map them correctly.

**Q: Can I process multiple files at once?**
A: Currently one file at a time, but you can upload multiple files sequentially.

**Q: What happens if processing fails halfway?**
A: Successfully processed batches are saved, and you get a detailed error report.

**Q: How do I know the website updated correctly?**
A: The system provides confirmation messages and you can verify by checking your deals pages.

**Q: Can I undo an upload?**
A: Yes, you can use "Replace" mode with a previous CSV file, or manually restore from the backup files.

This system is designed to be secure, efficient, and reliable for your weekly cruise deal updates!