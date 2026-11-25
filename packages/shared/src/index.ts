export type HouseId = 'red' | 'blue' | 'green' | 'amber';
export type PieceKind = 'SO' | 'EX' | 'CZ' | 'BS' | 'GI' | 'HE' | 'NI';

export interface GameRoom {
  id: string;
  name: string;
  houses: HouseId[];
  isPrivate: boolean;
  code?: string;
}
