import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import styles from './DropdownMenu.module.css';

function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.dropdownToggle}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {items.map((item, index) => (
            <button
              key={index}
              className={`${styles.dropdownItem} ${item.danger ? styles.danger : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleItemClick(item);
              }}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;

