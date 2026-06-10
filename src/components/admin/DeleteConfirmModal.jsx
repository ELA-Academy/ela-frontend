import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { Trash2 } from "lucide-react";

const DeleteConfirmModal = ({
  show,
  onHide,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to permanently delete this item? This action cannot be undone.",
  confirmText = "Delete",
  loading = False
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="delete-confirm-modal"
      backdrop="static"
    >
      <Modal.Body className="p-5 text-center">
        {/* Warning Icon Container */}
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-4 animate-bounce-short">
          <Trash2 className="w-6 h-6" />
        </div>
        
        {/* Modal Headings */}
        <h4 className="text-base font-bold text-slate-950 mb-2">{title}</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
          {message}
        </p>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={onHide}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors shadow-none"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs border-0 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" style={{ width: "12px", height: "12px" }} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                {confirmText}
              </>
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteConfirmModal;
