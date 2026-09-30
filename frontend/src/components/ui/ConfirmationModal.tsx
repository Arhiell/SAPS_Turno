import type {
  ReactNode,
} from 'react';

export type ConfirmationModalVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  message: string;
  detail?: ReactNode;
  confirmText: string;
  cancelText?: string;
  variant?: ConfirmationModalVariant;
  icon?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const buttonClasses: Record<ConfirmationModalVariant, string> = {
  success: 'btn-success',
  danger: 'btn-danger',
  warning: 'btn-warning text-dark',
  primary: 'btn-primary',
};

const iconClasses: Record<ConfirmationModalVariant, string> = {
  success: 'bg-success-subtle text-success',
  danger: 'bg-danger-subtle text-danger',
  warning: 'bg-warning-subtle text-warning',
  primary: 'bg-primary-subtle text-primary',
};

export default function ConfirmationModal({
  open,
  title,
  subtitle = 'Esta acción requiere confirmación.',
  message,
  detail,
  confirmText,
  cancelText = 'Cancelar',
  variant = 'warning',
  icon = 'bi-exclamation-triangle',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{
          zIndex: 1050,
        }}
      />

      <div
        className="modal d-block fade show"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        style={{
          zIndex: 1055,
        }}
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !loading
          ) {
            onClose();
          }
        }}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          role="document"
          style={{
            width: '100%',
            maxWidth: '520px',
            margin: '1rem auto',
            padding: '0 12px',
          }}
        >
          <div className="modal-content border-0 shadow-lg">
            <div
              className="modal-header border-0 pb-2 position-relative"
              style={{
                padding: '20px 56px 10px 20px',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${iconClasses[variant]}`}
                  style={{
                    width: '48px',
                    height: '48px',
                    flexShrink: 0,
                  }}
                >
                  <i className={`bi ${icon} fs-5`} />
                </div>

                <div>
                  <h5
                    className="modal-title fw-bold mb-1"
                    id="confirmation-modal-title"
                  >
                    {title}
                  </h5>

                  <p className="text-muted mb-0 small">
                    {subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-close position-absolute"
                aria-label="Cerrar"
                disabled={loading}
                onClick={onClose}
                style={{
                  top: '18px',
                  right: '18px',
                }}
              />
            </div>

            <div
              className="modal-body pt-2"
              style={{
                paddingLeft: '20px',
                paddingRight: '20px',
              }}
            >
              <p className="mb-2">{message}</p>

              {detail && <div className="bg-light border rounded p-3">{detail}</div>}

              <div
                className={`alert alert-${variant === 'warning' ? 'warning' : variant === 'danger' ? 'danger' : variant === 'success' ? 'success' : 'primary'} d-flex align-items-start gap-2 mt-3 mb-0 py-2`}
              >
                <i className="bi bi-info-circle-fill mt-1" />

                <small>
                  {variant === 'danger'
                    ? 'Esta acción no se puede deshacer y puede afectar otros registros del sistema.'
                    : variant === 'success'
                      ? 'La acción quedará disponible para el usuario en el sistema.'
                      : 'La operación se ejecutará solo si confirmás esta acción.'}
                </small>
              </div>
            </div>

            <div
              className="modal-footer border-0 pt-0"
              style={{
                padding: '8px 20px 20px',
                gap: '8px',
              }}
            >
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={loading}
                style={{
                  minWidth: '96px',
                }}
                onClick={onClose}
              >
                {cancelText}
              </button>

              <button
                type="button"
                className={`btn ${buttonClasses[variant]}`}
                disabled={loading}
                style={{
                  minWidth: '170px',
                }}
                onClick={onConfirm}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className={`bi ${icon} me-2`} />
                    {confirmText}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
