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
            ${showClose ? '<button onclick="ModalManager.close(\'' + id + '\')" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>' : ''}
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
    const content = `
      <p class="text-gray-600 mb-6">${message}</p>
      <div class="flex gap-3">
        <button onclick="ModalManager.close('${id}'); ${onCancel ? onCancel + '()' : ''}" 
          class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded font-semibold">
          Cancel
        </button>
        <button onclick="ModalManager.close('${id}'); ${onConfirm}()" 
          class="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded font-semibold">
          Confirm
        </button>
      </div>
    `;

    this.create(id, title, content, { showClose: true });
  },

  /**
   * Create an alert dialog
   */
  alert(title, message) {
    const id = 'modal_' + Helpers.generateId();
    const content = `
      <p class="text-gray-600 mb-6">${message}</p>
      <button onclick="ModalManager.close('${id}')" 
        class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold">
        OK
      </button>
    `;

    this.create(id, title, content, { showClose: false });
  }
};

// Make ModalManager globally available
window.ModalManager = ModalManager;
