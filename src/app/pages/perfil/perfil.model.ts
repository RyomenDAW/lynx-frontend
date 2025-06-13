export interface PerfilUsuario {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
  rol: string;
  saldo_virtual: number;
  avatar_base64: string;
  biblioteca?: JuegoBiblioteca[];
}

export interface JuegoBiblioteca {
  tiempo_jugado: number;
  juego: {
    titulo: string;
    imagen_portada?: string;
  };
}
