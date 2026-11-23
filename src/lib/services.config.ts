import { supabaseServices } from './supabaseServices';
import { mySqlServices } from './mySqlServices';

/**
 * Configuración centralizada para alternar entre backends.
 * Permite cambiar de Supabase a MySQL/PHP.
 */

const BACKEND_TYPE = import.meta.env.VITE_BACKEND_TYPE || 'supabase';
const activeServices = BACKEND_TYPE === 'supabase' ? supabaseServices : mySqlServices;

const contentService = activeServices;
const mediaService = activeServices;
const linkService = activeServices;
const menuService = activeServices;

export { activeServices, contentService, mediaService, linkService, menuService };
export const getActiveBackend = () => BACKEND_TYPE;
