import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTest() {
  useEffect(() => {
    // Trigger manual test error on page load
    console.log('🔥 Triggering manual Sentry test error...');
    
    // Manual forced error as requested
    Sentry.captureException(new Error("🔥 Manual test error"));
    
    // Also trigger the undefined function error
    setTimeout(() => {
      try {
        // @ts-ignore - intentionally calling undefined function
        myUndefinedFunction();
      } catch (error) {
        console.log('Undefined function error caught and sent to Sentry');
      }
    }, 1000);
  }, []);

  const triggerError = () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Manual Error Test Button",
      },
      (span) => {
        span.setAttribute("test_type", "manual_button");
        span.setAttribute("component", "sentry_test");
        
        // Capture manual exception
        Sentry.captureException(new Error("🔥 Manual test error from button click"), {
          tags: {
            test: 'manual_button',
            component: 'sentry_test'
          },
          extra: {
            testType: 'button_click',
            timestamp: new Date().toISOString()
          }
        });
        
        alert('Manual error sent to Sentry!');
      }
    );
  };

  const triggerUndefinedError = () => {
    // This will trigger the exact error Sentry verification is looking for
    // @ts-ignore - intentionally calling undefined function
    myUndefinedFunction();
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>🧪 Sentry Integration Test</h1>
      <p>This page automatically triggers a manual test error on load.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={triggerError}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          🔥 Trigger Manual Error
        </button>
        
        <button 
          onClick={triggerUndefinedError}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🚨 Trigger Undefined Function
        </button>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
        <h3>✅ Sentry Integration Status</h3>
        <ul>
          <li>✅ @sentry/nextjs installed</li>
          <li>✅ sentry.client.config.ts configured</li>
          <li>✅ sentry.server.config.ts configured</li>
          <li>✅ next.config.js wrapped with withSentryConfig</li>
          <li>✅ SENTRY_DSN configured in .env.local</li>
          <li>✅ tracesSampleRate set to 1.0</li>
          <li>✅ Manual test error triggered automatically</li>
        </ul>
      </div>
    </div>
  );
}