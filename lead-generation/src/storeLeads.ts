// Store leads in Supabase database
import { supabase, getExistingEmails } from './supabaseClient.js';
import type { EmailLead, StoredLead } from './types.js';

export class LeadStorage {
  private insertedCount = 0;
  private skippedCount = 0;
  private errorCount = 0;

  // Store leads in database, avoiding duplicates
  async storeLeads(leads: EmailLead[]): Promise<StoredLead[]> {
    console.log(`💾 Storing ${leads.length} leads in database...`);

    if (leads.length === 0) {
      console.log('   No leads to store');
      return [];
    }

    try {
      // Get existing emails to avoid duplicates
      const existingEmails = await getExistingEmails();
      console.log(`   Found ${existingEmails.size} existing emails in database`);

      // Filter out duplicates
      const newLeads = leads.filter(lead => {
        const emailLower = lead.email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          this.skippedCount++;
          return false;
        }
        return true;
      });

      console.log(`   ${newLeads.length} new leads to insert (${this.skippedCount} duplicates skipped)`);

      if (newLeads.length === 0) {
        return [];
      }

      // Prepare data for insertion
      const leadsToInsert = newLeads.map(lead => ({
        email: lead.email.toLowerCase(),
        domain: lead.domain,
        source_url: lead.sourceUrl,
        contact_name: lead.contactName || null,
        phone_number: lead.phoneNumber || null,
        company_name: lead.companyName || null,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      // Insert in batches to avoid timeout
      const batchSize = 100;
      const insertedLeads: StoredLead[] = [];

      for (let i = 0; i < leadsToInsert.length; i += batchSize) {
        const batch = leadsToInsert.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase
            .from('leads')
            .insert(batch)
            .select();

          if (error) {
            console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            this.errorCount += batch.length;
          } else {
            insertedLeads.push(...(data || []));
            this.insertedCount += batch.length;
            console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(leadsToInsert.length / batchSize)} (${batch.length} leads)`);
          }
        } catch (error) {
          console.error(`❌ Exception inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          this.errorCount += batch.length;
        }
      }

      console.log(`✅ Storage complete: ${this.insertedCount} inserted, ${this.skippedCount} skipped, ${this.errorCount} errors`);
      return insertedLeads;

    } catch (error) {
      console.error('❌ Error in lead storage:', error);
      return [];
    }
  }

  // Store a single lead
  async storeLead(lead: EmailLead): Promise<StoredLead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          email: lead.email.toLowerCase(),
          domain: lead.domain,
          source_url: lead.sourceUrl,
          contact_name: lead.contactName || null,
          phone_number: lead.phoneNumber || null,
          company_name: lead.companyName || null,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`   Skipped duplicate email: ${lead.email}`);
          this.skippedCount++;
          return null;
        }
        throw error;
      }

      this.insertedCount++;
      return data;
    } catch (error) {
      console.error(`❌ Error storing lead ${lead.email}:`, error);
      this.errorCount++;
      return null;
    }
  }

  // Get leads by status for processing
  async getLeadsForProcessing(status: string = 'pending', limit: number = 100): Promise<StoredLead[]> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error(`❌ Error fetching leads with status ${status}:`, error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error(`❌ Error fetching leads with status ${status}:`, error);
      return [];
    }
  }

  // Update lead status after email sending
  async updateLeadStatus(
    leadId: string, 
    status: string, 
    additionalData: Partial<StoredLead> = {}
  ): Promise<boolean> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId);

      if (error) {
        console.error(`❌ Error updating lead ${leadId}:`, error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error updating lead ${leadId}:`, error);
      return false;
    }
  }

  // Get storage statistics
  getStorageStats(): { inserted: number; skipped: number; errors: number } {
    return {
      inserted: this.insertedCount,
      skipped: this.skippedCount,
      errors: this.errorCount,
    };
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    totalLeads: number;
    pendingLeads: number;
    sentLeads: number;
    bouncedLeads: number;
    repliedLeads: number;
  }> {
    try {
      const { data: totalData } = await supabase
        .from('leads')
        .select('id', { count: 'exact' });

      const { data: pendingData } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      const { data: sentData } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('status', 'sent');

      const { data: bouncedData } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('status', 'bounced');

      const { data: repliedData } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('status', 'replied');

      return {
        totalLeads: totalData?.length || 0,
        pendingLeads: pendingData?.length || 0,
        sentLeads: sentData?.length || 0,
        bouncedLeads: bouncedData?.length || 0,
        repliedLeads: repliedData?.length || 0,
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      return {
        totalLeads: 0,
        pendingLeads: 0,
        sentLeads: 0,
        bouncedLeads: 0,
        repliedLeads: 0,
      };
    }
  }

  // Clean up old leads (optional maintenance function)
  async cleanupOldLeads(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('leads')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('status', 'bounced')
        .select('id');

      if (error) {
        console.error('❌ Error cleaning up old leads:', error.message);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleaned up ${deletedCount} old bounced leads`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up old leads:', error);
      return 0;
    }
  }
}