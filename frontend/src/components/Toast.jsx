import { Toaster } from 'react-hot-toast';
import styles from './Toast.module.css';

function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName={styles.toastContainer}
      containerStyle={{
        top: 80,
        right: 20,
      }}
      toastOptions={{
        duration: 4000,
        success: {
          className: styles.toastSuccess,
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        error: {
          className: styles.toastError,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
        loading: {
          className: styles.toastLoading,
          iconTheme: {
            primary: '#6366F1',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

export default CustomToaster;
