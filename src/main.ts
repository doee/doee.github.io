import './styles.css';
import { mountAll } from './engine/component';

// Every file in components/ registers itself; importing them is enough.
import.meta.glob('./components/*.ts', { eager: true });

mountAll();
