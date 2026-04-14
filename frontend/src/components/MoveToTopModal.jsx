import { ArrowUpToLine, X } from 'lucide-react';
import styles from './MoveToTopModal.module.css';

function MoveToTopModal({ isOpen, onClose, onConfirm, phoneNumber }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconContainer}>
            <ArrowUpToLine size={28} className={styles.icon} />
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>Mover para o Topo</h2>
          <p className={styles.message}>
            O número <strong className={styles.phoneNumber}>{phoneNumber}</strong> será movido para o início da lista de envio.
          </p>
          <p className={styles.subMessage}>
            Este número será o primeiro a receber a mensagem quando a campanha iniciar.
          </p>
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancelar
          </button>
          <button onClick={onConfirm} className={styles.confirmBtn}>
            <ArrowUpToLine size={18} />
            Mover para o Topo
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveToTopModal;
