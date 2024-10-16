import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    typeof document !== 'undefined' ? require('bootstrap/dist/js/bootstrap.bundle.min.js') : null;
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
