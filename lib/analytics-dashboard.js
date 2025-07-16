// Analytics Dashboard - Interline Asia Enterprise Phase 2
// Enhanced analytics with dashboard interface and automated insights

import { createClient } from '@supabase/supabase-js';

class AnalyticsDashboard {
  constructor() {
    this.supabase = null;
    this.cache = new Map();
    this.cacheExpiry = 300000; // 5 minutes
    this.initializeClient();
  }

  initializeClient() {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        console.log('✅ Analytics Dashboard initialized');
      }
    } catch (error) {
      console.warn('⚠️ Analytics Dashboard initialization failed:', error.message);
    }
  }

  // Get comprehensive analytics overview
  async getAnalyticsOverview(timeRange = '7d') {
    const cacheKey = `overview_${timeRange}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const startDate = this.getStartDate(timeRange);
      const overview = {
        timeRange,
        period: startDate.toISOString(),
        metrics: {},
        trends: {},
        insights: []
      };

      // Get basic metrics
      overview.metrics = await this.getBasicMetrics(startDate);
      
      // Get user engagement
      overview.engagement = await this.getUserEngagement(startDate);
      
      // Get popular content
      overview.popularContent = await this.getPopularContent(startDate);
      
      // Get conversion funnel
      overview.conversions = await this.getConversionFunnel(startDate);
      
      // Get performance metrics
      overview.performance = await this.getPerformanceMetrics(startDate);
      
      // Generate insights
      overview.insights = await this.generateInsights(overview);

      this.setCache(cacheKey, overview);
      return overview;

    } catch (error) {
      console.error('Analytics overview error:', error);
      return this.getFallbackOverview();
    }
  }

  async getBasicMetrics(startDate) {
    const metrics = {
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      bounceRate: 0,
      avgSessionDuration: 0
    };

    try {
      if (this.supabase) {
        // Get page views
        const { data: pageViews } = await this.supabase
          .from('analytics_events')
          .select('*')
          .eq('event_name', 'page_view')
          .gte('timestamp', startDate.toISOString());

        metrics.pageViews = pageViews?.length || 0;

        // Get unique sessions
        const uniqueSessions = new Set(pageViews?.map(pv => pv.session_id) || []);
        metrics.sessions = uniqueSessions.size;

        // Get unique users (approximation based on user_agent + session patterns)
        const uniqueUsers = new Set(pageViews?.map(pv => `${pv.user_agent}_${pv.session_id}`.substring(0, 50)) || []);
        metrics.uniqueVisitors = uniqueUsers.size;

        // Calculate bounce rate (sessions with only 1 page view)
        const sessionPageCounts = {};
        pageViews?.forEach(pv => {
          sessionPageCounts[pv.session_id] = (sessionPageCounts[pv.session_id] || 0) + 1;
        });
        
        const bouncedSessions = Object.values(sessionPageCounts).filter(count => count === 1).length;
        metrics.bounceRate = metrics.sessions > 0 ? Math.round((bouncedSessions / metrics.sessions) * 100) : 0;

      } else {
        // Fallback to localStorage data
        const localEvents = this.getLocalAnalyticsData();
        const recentEvents = localEvents.filter(event => 
          new Date(event.timestamp) >= startDate && event.eventName === 'page_view'
        );
        
        metrics.pageViews = recentEvents.length;
        metrics.sessions = new Set(recentEvents.map(e => e.sessionId)).size;
        metrics.uniqueVisitors = Math.ceil(metrics.sessions * 0.8); // Estimate
      }

    } catch (error) {
      console.warn('Basic metrics error:', error.message);
    }

    return metrics;
  }

  async getUserEngagement(startDate) {
    const engagement = {
      topPages: [],
      userFlow: [],
      timeOnSite: {},
      deviceTypes: {},
      referrers: {}
    };

    try {
      if (this.supabase) {
        // Get top pages
        const { data: pageViews } = await this.supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_name', 'page_view')
          .gte('timestamp', startDate.toISOString());

        const pageCounts = {};
        pageViews?.forEach(pv => {
          const page = pv.properties?.page || 'unknown';
          pageCounts[page] = (pageCounts[page] || 0) + 1;
        });

        engagement.topPages = Object.entries(pageCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([page, views]) => ({ page, views }));

        // Get user interactions
        const { data: interactions } = await this.supabase
          .from('analytics_events')
          .select('*')
          .in('event_name', ['element_click', 'quote_click', 'booking_submission'])
          .gte('timestamp', startDate.toISOString());

        const clickCounts = {};
        interactions?.forEach(interaction => {
          const element = interaction.properties?.elementText || interaction.event_name;
          clickCounts[element] = (clickCounts[element] || 0) + 1;
        });

        engagement.topInteractions = Object.entries(clickCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([element, clicks]) => ({ element, clicks }));

      } else {
        // Fallback to localStorage
        const localEvents = this.getLocalAnalyticsData();
        const recentPageViews = localEvents.filter(event => 
          new Date(event.timestamp) >= startDate && event.eventName === 'page_view'
        );

        const pageCounts = {};
        recentPageViews.forEach(pv => {
          const page = pv.properties?.page || 'unknown';
          pageCounts[page] = (pageCounts[page] || 0) + 1;
        });

        engagement.topPages = Object.entries(pageCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([page, views]) => ({ page, views }));
      }

    } catch (error) {
      console.warn('User engagement error:', error.message);
    }

    return engagement;
  }

  async getPopularContent(startDate) {
    const content = {
      cruiseDeals: [],
      searchQueries: [],
      bookingRequests: []
    };

    try {
      if (this.supabase) {
        // Get popular cruise deals
        const { data: quoteClicks } = await this.supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_name', 'quote_click')
          .gte('timestamp', startDate.toISOString());

        const dealCounts = {};
        quoteClicks?.forEach(click => {
          const cruiseId = click.properties?.cruiseId;
          const cruiseName = click.properties?.cruiseName || `Cruise ${cruiseId}`;
          if (cruiseId) {
            dealCounts[cruiseId] = {
              name: cruiseName,
              clicks: (dealCounts[cruiseId]?.clicks || 0) + 1
            };
          }
        });

        content.cruiseDeals = Object.entries(dealCounts)
          .sort(([,a], [,b]) => b.clicks - a.clicks)
          .slice(0, 10)
          .map(([id, data]) => ({ cruiseId: id, ...data }));

        // Get search queries
        const { data: searches } = await this.supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_name', 'search')
          .gte('timestamp', startDate.toISOString());

        const searchCounts = {};
        searches?.forEach(search => {
          const query = search.properties?.query;
          if (query) {
            searchCounts[query] = (searchCounts[query] || 0) + 1;
          }
        });

        content.searchQueries = Object.entries(searchCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }));
      }

    } catch (error) {
      console.warn('Popular content error:', error.message);
    }

    return content;
  }

  async getConversionFunnel(startDate) {
    const funnel = {
      steps: [
        { name: 'Page Views', count: 0 },
        { name: 'Deal Views', count: 0 },
        { name: 'Quote Clicks', count: 0 },
        { name: 'Booking Submissions', count: 0 },
        { name: 'Signups', count: 0 }
      ],
      conversionRates: {}
    };

    try {
      if (this.supabase) {
        // Get funnel data
        const { data: events } = await this.supabase
          .from('analytics_events')
          .select('event_name, session_id')
          .gte('timestamp', startDate.toISOString());

        const eventCounts = {};
        events?.forEach(event => {
          eventCounts[event.event_name] = (eventCounts[event.event_name] || 0) + 1;
        });

        funnel.steps[0].count = eventCounts['page_view'] || 0;
        funnel.steps[1].count = eventCounts['deal_view'] || 0;
        funnel.steps[2].count = eventCounts['quote_click'] || 0;
        funnel.steps[3].count = eventCounts['booking_submission'] || 0;
        funnel.steps[4].count = eventCounts['user_signup'] || 0;

        // Calculate conversion rates
        for (let i = 1; i < funnel.steps.length; i++) {
          const current = funnel.steps[i].count;
          const previous = funnel.steps[i - 1].count;
          const rate = previous > 0 ? Math.round((current / previous) * 100) : 0;
          funnel.conversionRates[`${funnel.steps[i - 1].name} to ${funnel.steps[i].name}`] = rate;
        }
      }

    } catch (error) {
      console.warn('Conversion funnel error:', error.message);
    }

    return funnel;
  }

  async getPerformanceMetrics(startDate) {
    const performance = {
      averageLoadTime: 0,
      errorRate: 0,
      uptime: 100,
      slowPages: [],
      errorBreakdown: {}
    };

    try {
      if (this.supabase) {
        // Get performance metrics
        const { data: perfEvents } = await this.supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_name', 'performance_metric')
          .gte('timestamp', startDate.toISOString());

        const loadTimes = perfEvents?.filter(e => e.properties?.metricName === 'loadTime')
          .map(e => e.properties?.value) || [];

        if (loadTimes.length > 0) {
          performance.averageLoadTime = Math.round(
            loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
          );
        }

        // Get error metrics
        const { data: errors } = await this.supabase
          .from('analytics_events')
          .select('properties')
          .eq('event_name', 'error_occurred')
          .gte('timestamp', startDate.toISOString());

        const totalEvents = await this.getTotalEvents(startDate);
        performance.errorRate = totalEvents > 0 ? 
          Math.round((errors?.length || 0) / totalEvents * 100) : 0;

        // Error breakdown
        const errorTypes = {};
        errors?.forEach(error => {
          const type = error.properties?.errorType || 'unknown';
          errorTypes[type] = (errorTypes[type] || 0) + 1;
        });
        performance.errorBreakdown = errorTypes;
      }

    } catch (error) {
      console.warn('Performance metrics error:', error.message);
    }

    return performance;
  }

  async generateInsights(overview) {
    const insights = [];

    try {
      // Traffic insights
      if (overview.metrics.pageViews > 0) {
        const avgPagesPerSession = Math.round(overview.metrics.pageViews / overview.metrics.sessions);
        insights.push({
          type: 'traffic',
          title: 'Session Engagement',
          message: `Users view an average of ${avgPagesPerSession} pages per session`,
          severity: avgPagesPerSession >= 3 ? 'positive' : avgPagesPerSession >= 2 ? 'neutral' : 'negative'
        });
      }

      // Bounce rate insights
      if (overview.metrics.bounceRate > 0) {
        insights.push({
          type: 'engagement',
          title: 'Bounce Rate',
          message: `${overview.metrics.bounceRate}% of sessions are single-page visits`,
          severity: overview.metrics.bounceRate <= 40 ? 'positive' : 
                   overview.metrics.bounceRate <= 60 ? 'neutral' : 'negative'
        });
      }

      // Popular content insights
      if (overview.popularContent.cruiseDeals.length > 0) {
        const topDeal = overview.popularContent.cruiseDeals[0];
        insights.push({
          type: 'content',
          title: 'Popular Cruise Deal',
          message: `"${topDeal.name}" is the most clicked deal with ${topDeal.clicks} clicks`,
          severity: 'positive'
        });
      }

      // Performance insights
      if (overview.performance.averageLoadTime > 0) {
        insights.push({
          type: 'performance',
          title: 'Page Load Speed',
          message: `Average load time is ${overview.performance.averageLoadTime}ms`,
          severity: overview.performance.averageLoadTime <= 2000 ? 'positive' : 
                   overview.performance.averageLoadTime <= 4000 ? 'neutral' : 'negative'
        });
      }

      // Error rate insights
      if (overview.performance.errorRate > 0) {
        insights.push({
          type: 'reliability',
          title: 'Error Rate',
          message: `${overview.performance.errorRate}% of events resulted in errors`,
          severity: overview.performance.errorRate <= 1 ? 'positive' : 
                   overview.performance.errorRate <= 5 ? 'neutral' : 'negative'
        });
      }

    } catch (error) {
      console.warn('Insights generation error:', error.message);
    }

    return insights;
  }

  // Utility methods
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  async getTotalEvents(startDate) {
    try {
      const { data, error } = await this.supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .gte('timestamp', startDate.toISOString());
      
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  }

  getLocalAnalyticsData() {
    try {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch (error) {
      return [];
    }
  }

  getFallbackOverview() {
    return {
      timeRange: '7d',
      metrics: {
        pageViews: 0,
        uniqueVisitors: 0,
        sessions: 0,
        bounceRate: 0
      },
      engagement: { topPages: [], topInteractions: [] },
      popularContent: { cruiseDeals: [], searchQueries: [] },
      conversions: { steps: [], conversionRates: {} },
      performance: { averageLoadTime: 0, errorRate: 0 },
      insights: [{
        type: 'info',
        title: 'Analytics Initializing',
        message: 'Analytics data will appear as users interact with the site',
        severity: 'neutral'
      }]
    };
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Export data for external analysis
  async exportAnalyticsData(timeRange = '30d', format = 'json') {
    try {
      const overview = await this.getAnalyticsOverview(timeRange);
      const exportData = {
        exportedAt: new Date().toISOString(),
        timeRange,
        ...overview
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    // Simple CSV conversion for basic metrics
    const csv = [];
    csv.push('Metric,Value');
    csv.push(`Page Views,${data.metrics.pageViews}`);
    csv.push(`Unique Visitors,${data.metrics.uniqueVisitors}`);
    csv.push(`Sessions,${data.metrics.sessions}`);
    csv.push(`Bounce Rate,${data.metrics.bounceRate}%`);
    csv.push(`Average Load Time,${data.performance.averageLoadTime}ms`);
    csv.push(`Error Rate,${data.performance.errorRate}%`);
    
    return csv.join('\n');
  }
}

// Create singleton instance
const analyticsDashboard = new AnalyticsDashboard();

// Export main functions
export const getAnalyticsOverview = (timeRange) => analyticsDashboard.getAnalyticsOverview(timeRange);
export const exportAnalyticsData = (timeRange, format) => analyticsDashboard.exportAnalyticsData(timeRange, format);
export const clearCache = () => analyticsDashboard.clearCache();

export default analyticsDashboard;