export interface Usuario {
  id: number;
  username: string;
  avatar_base64: string;
}

export interface Amistad {
  id: number;
  solicitante: Usuario;
  receptor: Usuario;
  estado: 'PENDIENTE' | 'ACEPTADA';
}
