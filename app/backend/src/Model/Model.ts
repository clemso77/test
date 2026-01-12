export type Ligne = {
    nom?: string,
    couleur?: string,
    long_nom?: string
    id: number;
    geometries?: [number, number][];
    stopIds?:  number[];
};

export type Arret = {
    nom: string;
    id: number;
    position: {
        lat: number;
        long: number;
    };
    sequence: number;
};
