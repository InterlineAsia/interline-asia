// Loading States Manager - Unified loading indicators and states
// Provides consistent loading UX across the entire site

class LoadingStatesManager {
  constructor() {
    this.activeLoaders = new Set();
    this.loadingOverlays = new Map();
    this.setupGlobalStyles();
  }

  // Setup global loading styles
  setupGlobalStyles() {
    if (document.getElementById('loading-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'loading-styles';
    styles.textContent = `
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(2px);
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .loading-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        text-align: center;
        max-width: 300px;
      }

      .loading-text {
        margin-top: 1rem;
        color: #374151;
        font-weight: 500;
      }

      .loading-progress {
        width: 100%;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        margin-top: 1rem;
        overflow: hidden;
      }

      .loading-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        border-radius: 2px;
        transition: width 0.3s ease;
      }

      .inline-loading {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
        font-size: 14px;
      }

      .inline-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .skeleton {
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
      }

      .skeleton-text {
        height: 1em;
        border-radius: 4px;
        margin: 0.5em 0;
      }

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      .skeleton-card {
        height: 200px;
        border-radius: 8px;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      .btn-loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
      }

      .btn-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 16px;
        height: 16px;
        margin: -8px 0 0 -8px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(styles);
  }

  // Show full-screen loading overlay
  showOverlay(id = 'default', options = {}) {
    const {
      message = 'Loading...',
      showProgress = false,
      progress = 0,
      cancellable = false,
      onCancel = null
    } = options;

    // Remove existing overlay with same ID
    this.hideOverlay(id);

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = `loading-overlay-${id}`;

    const content = document.createElement('div');
    content.className = 'loading-content';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    const text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = message;

    content.appendChild(spinner);
    content.appendChild(text);

    if (showProgress) {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'loading-progress';
      
      const progressBar = document.createElement('div');
      progressBar.className = 'loading-progress-bar';
      progressBar.style.width = `${progress}%`;
      progressBar.id = `progress-bar-${id}`;
      
      progressContainer.appendChild(progressBar);
      content.appendChild(progressContainer);
    }

    if (cancellable && onCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = `
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      `;
      cancelBtn.onclick = () => {
        this.hideOverlay(id);
        onCancel();
      };
      content.appendChild(cancelBtn);
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    this.loadingOverlays.set(id, overlay);
    this.activeLoaders.add(id);

    return id;
  }

  // Update overlay message and progress
  updateOverlay(id, options = {}) {
    const overlay = this.loadingOverlays.get(id);
    if (!overlay) return;

    const { message, progress } = options;

    if (message) {
      const textEl = overlay.querySelector('.loading-text');
      if (textEl) textEl.textContent = message;
    }

    if (progress !== undefined) {
      const progressBar = overlay.querySelector(`#progress-bar-${id}`);
      if (progressBar) progressBar.style.width = `${progress}%`;
    }
  }

  // Hide loading overlay
  hideOverlay(id = 'default') {
    const overlay = this.loadingOverlays.get(id);
    if (overlay && overlay.parentNode) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 200);
    }

    this.loadingOverlays.delete(id);
    this.activeLoaders.delete(id);
  }

  // Show inline loading indicator
  showInlineLoading(element, message = 'Loading...') {
    if (!element) return;

    const loadingEl = document.createElement('span');
    loadingEl.className = 'inline-loading';
    loadingEl.innerHTML = `
      <div class="inline-spinner"></div>
      <span>${message}</span>
    `;

    // Store original content
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(loadingEl);
    element.disabled = true;
  }

  // Hide inline loading indicator
  hideInlineLoading(element) {
    if (!element) return;

    const originalContent = element.dataset.originalContent;
    if (originalContent) {
      element.innerHTML = originalContent;
      delete element.dataset.originalContent;
    }
    element.disabled = false;
  }

  // Show button loading state
  showButtonLoading(button, loadingText = null) {
    if (!button) return;

    button.dataset.originalText = button.textContent;
    button.classList.add('btn-loading');
    
    if (loadingText) {
      button.textContent = loadingText;
    }
    
    button.disabled = true;
  }

  // Hide button loading state
  hideButtonLoading(button) {
    if (!button) return;

    button.classList.remove('btn-loading');
    
    const originalText = button.dataset.originalText;
    if (originalText) {
      button.textContent = originalText;
      delete button.dataset.originalText;
    }
    
    button.disabled = false;
  }

  // Create skeleton loading for content
  createSkeleton(container, type = 'text', count = 3) {
    if (!container) return;

    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
      const skeleton = document.createElement('div');
      skeleton.className = `skeleton skeleton-${type}`;
      
      if (type === 'text') {
        skeleton.style.width = `${60 + Math.random() * 40}%`;
      }
      
      container.appendChild(skeleton);
    }
  }

  // Remove skeleton loading
  removeSkeleton(container) {
    if (!container) return;
    
    const skeletons = container.querySelectorAll('.skeleton');
    skeletons.forEach(skeleton => skeleton.remove());
  }

  // Wrap async operation with loading state
  async withLoading(operation, options = {}) {
    const {
      type = 'overlay',
      element = null,
      message = 'Loading...',
      id = 'operation'
    } = options;

    let loadingId;

    try {
      // Show loading state
      switch (type) {
        case 'overlay':
          loadingId = this.showOverlay(id, { message });
          break;
        case 'inline':
          this.showInlineLoading(element, message);
          break;
        case 'button':
          this.showButtonLoading(element, message);
          break;
        case 'skeleton':
          this.createSkeleton(element, options.skeletonType, options.skeletonCount);
          break;
      }

      // Execute operation
      const result = await operation();

      return result;
    } finally {
      // Hide loading state
      switch (type) {
        case 'overlay':
          this.hideOverlay(loadingId || id);
          break;
        case 'inline':
          this.hideInlineLoading(element);
          break;
        case 'button':
          this.hideButtonLoading(element);
          break;
        case 'skeleton':
          this.removeSkeleton(element);
          break;
      }
    }
  }

  // Check if any loading is active
  isLoading(id = null) {
    if (id) {
      return this.activeLoaders.has(id);
    }
    return this.activeLoaders.size > 0;
  }

  // Hide all loading states
  hideAll() {
    for (const id of this.activeLoaders) {
      this.hideOverlay(id);
    }
  }
}

// Initialize global loading manager
window.loadingManager = new LoadingStatesManager();

// Export convenience functions
window.showLoading = (id, options) => window.loadingManager.showOverlay(id, options);
window.hideLoading = (id) => window.loadingManager.hideOverlay(id);
window.withLoading = (operation, options) => window.loadingManager.withLoading(operation, options);

console.log('✅ Loading States Manager initialized');