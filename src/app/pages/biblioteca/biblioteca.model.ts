export interface JuegoBiblioteca {
  id: number;
  favorito: boolean;
  tiempo_jugado: number;
  juego: {
    id: number;
    titulo: string;
    imagen_portada_base64: string; // Asegúrate de usar este campo
  };
}
