import axios from "axios";

/**
 * URL del backend. Se usa de dos formas distintas:
 * - como baseURL de axios, para las llamadas XHR normales;
 * - con window.location, para los flujos OAuth: son redirecciones de página
 *   completa hacia Google/Facebook, así que no pueden pasar por axios.
 */
const rawBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '')

const myntedAPI = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
})

export default myntedAPI
