/**
 * Modal Management Utility
 * Handles creation and management of modals
 */

const ModalManager = {
  /**
   * Create and show a modal
   */
  create(id, title, content, options = {}) {
    const {
      width = 'max-w-md',
      showClose = true,
      closeOnBackdrop = true,
      onClose = null
    } = options;

    // Check if modal already exists
    let modal = document.getElementById(id);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = id;
      modal.className = 'modal hidden';
      modal.innerHTML = `
        <div class="modal-content ${width}">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold text-gray-900">${title}</h3>
            ${showClose ? `<button class="modal-close-btn text-gray-400 hover:text-gray-600 text-2xl" data-modal-id="${id}">&times;</button>` : ''}
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      `;

      // Add close on backdrop click
      if (closeOnBackdrop) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.close(id);
            if (onClose) onClose();
          }
        });
      }

      // Add close button listener
      const closeBtn = modal.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.close(id);
          if (onClose) onClose();
        });
      }

      document.getElementById('modals-container').appendChild(modal);
    }

    this.show(id);
    return modal;
  },

  /**
   * Show a modal
   */
  show(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('hidden');
    }
  },

  /**
   * Close a modal
   */
  close(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('hidden');
    }
  },

  /**
   * Toggle modal visibility
   */
  toggle(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.toggle('hidden');
    }
  },

  /**
   * Close all modals
   */
  closeAll() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  },

  /**
   * Create a confirm dialog
   */
  confirm(title, message, onConfirm, onCancel = null) {
    const id = 'modal_' + Helpers.generateId();
    const cancelHandler = onCancel ? `${onCancel}();` : '';
    const content = `
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex gap-3">
        <button class="cancel-btn flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded font-semibold" data-modal-id="${id}" data-callback="${cancelHandler}">
          Cancel
        </button>
        <button class="confirm-btn flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-semibold" data-modal-id="${id}" data-callback="${onConfirm}()">
          Confirm
        </button>
      </div>
    `;

    this.create(id, title, content, { showClose: true });
    
    // Add event listeners
    setTimeout(() => {
      const cancelBtn = document.querySelector(`[data-modal-id="${id}"].cancel-btn`);
      const confirmBtn = document.querySelector(`[data-modal-id="${id}"].confirm-btn`);
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.close(id);
          if (onCancel && typeof window[onCancel] === 'function') {
            window[onCancel]();
          }
        });
      }
      
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.close(id);
          if (onConfirm && typeof window[onConfirm] === 'function') {
            window[onConfirm]();
          }
        });
      }
    }, 0);
  },

  /**
   * Create an alert dialog
   */
  alert(title, message) {
    const id = 'modal_' + Helpers.generateId();
    const content = `
      <p class="text-gray-600 mb-6">${message}</p>
      <button class="alert-btn w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold" data-modal-id="${id}">
        OK
      </button>
    `;

    this.create(id, title, content, { showClose: false });
    
    // Add event listener
    setTimeout(() => {
      const btn = document.querySelector(`[data-modal-id="${id}"].alert-btn`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.close(id);
        });
      }
    }, 0);
  }
};

// Make ModalManager globally available
window.ModalManager = ModalManager;
