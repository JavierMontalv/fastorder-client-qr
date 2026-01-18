// client-qr/src/api/productoApi.js
import api from './axiosConfig';

// Obtener todos los productos del restaurante
export const obtenerProductos = async () => {
  const res = await api.get('/productos/public');
  return res.data;
};

// Obtener detalle por ID
export const obtenerProductoPorId = async (id) => {
  const res = await api.get(`/productos/public/${id}`);
  return res.data;
};
