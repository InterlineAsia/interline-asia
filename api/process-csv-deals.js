import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxreyyxbuwxjfmtvdkji.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseKey) {
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: Missing Supabase service role key'
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify admin access
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token or user not found'
            });
        }

        // Check if user is admin
        const adminEmails = [
            'rodney@telenational.com.au',
            'admin@interlineasia.com',
            'support@interlineasia.com'
        ];

        if (!adminEmails.includes(user.email)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied: Admin privileges required'
            });
        }

        // Get list of CSV files from storage
        const { data: files, error: listError } = await supabase.storage
            .from('uploads')
            .list('', {
                limit: 200,
                sortBy: { column: 'updated_at', order: 'desc' }
            });

        if (listError) {
            console.error('Storage list error:', listError);
            return res.status(500).json({
                success: false,
                error: `Failed to list files: ${listError.message}`
            });
        }

        // Filter for CSV files
        const csvFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.csv')
        );

        if (csvFiles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No CSV files found in storage'
            });
        }

        let processedCount = 0;
        let totalDeals = 0;
        let errors = [];

        // Process each CSV file
        for (const file of csvFiles) {
            try {
                // Download file content
                const { data: fileData, error: downloadError } = await supabase.storage
                    .from('uploads')
                    .download(file.name);

                if (downloadError) {
                    errors.push(`Failed to download ${file.name}: ${downloadError.message}`);
                    continue;
                }

                // Convert blob to text
                const csvContent = await fileData.text();
                
                if (!csvContent || csvContent.trim().length === 0) {
                    errors.push(`File ${file.name} is empty`);
                    continue;
                }

                // Parse CSV content
                const deals = parseCSV(csvContent);

                if (deals.length === 0) {
                    errors.push(`No valid data found in ${file.name}`);
                    continue;
                }

                // Insert deals into database
                const { error: insertError } = await supabase
                    .from('cruise_deals')
                    .upsert(deals, {
                        onConflict: 'cruise_line,ship_name,departure_date',
                        ignoreDuplicates: false
                    });

                if (insertError) {
                    errors.push(`Database insert error for ${file.name}: ${insertError.message}`);
                } else {
                    processedCount++;
                    totalDeals += deals.length;
                }

            } catch (fileError) {
                errors.push(`Error processing ${file.name}: ${fileError.message}`);
            }
        }

        // Return results
        const message = `Successfully processed ${processedCount} CSV files with ${totalDeals} deals total.`;
        
        return res.status(200).json({
            success: true,
            message: message,
            details: {
                filesProcessed: processedCount,
                totalFiles: csvFiles.length,
                totalDeals: totalDeals,
                errors: errors
            }
        });

    } catch (error) {
        console.error('CSV processing error:', error);
        return res.status(500).json({
            success: false,
            error: `Processing failed: ${error.message}`
        });
    }
}

// Helper function to parse CSV content
function parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const deals = [];

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            if (values.length !== headers.length) continue;

            const deal = {};
            headers.forEach((header, index) => {
                deal[header] = values[index] || '';
            });

            // Transform to database schema
            const transformedDeal = {
                cruise_line: deal['Cruise Line'] || deal.cruise_line || deal['cruise_line'] || '',
                ship_name: deal.Ship || deal.ship_name || deal['ship_name'] || '',
                departure_date: formatDate(deal.Date || deal.departure_date || deal['departure_date'] || ''),
                region: deal.Region || deal.region || deal['region'] || '',
                nights: parseInt(deal.Nights || deal.nights || deal['nights'] || 0),
                itinerary: deal.Itinerary || deal.itinerary || deal['itinerary'] || '',
                inside_price: parsePrice(deal.Inside || deal.inside_price || deal['inside_price']),
                oceanview_price: parsePrice(deal.Oceanview || deal.oceanview_price || deal['oceanview_price']),
                balcony_price: parsePrice(deal.Balcony || deal.balcony_price || deal['balcony_price']),
                suite_price: parsePrice(deal.Suite || deal.suite_price || deal['suite_price']),
                departure_port: deal.From || deal.departure_port || deal['departure_port'] || '',
                arrival_port: deal.To || deal.arrival_port || deal['arrival_port'] || '',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Only add deals with required fields
            if (transformedDeal.cruise_line && transformedDeal.ship_name) {
                deals.push(transformedDeal);
            }
        } catch (lineError) {
            console.warn(`Error parsing line ${i}:`, lineError);
        }
    }

    return deals;
}

// Helper function to parse CSV line
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result.map(val => val.trim().replace(/"/g, ''));
}

// Helper function to parse price
function parsePrice(price) {
    if (!price) return null;
    if (typeof price === 'string' && price.toLowerCase().includes('quote')) return null;

    const cleaned = price.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
}

// Helper function to format date
function formatDate(dateStr) {
    if (!dateStr) return null;

    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    } catch (error) {
        return null;
    }
}