interface ProductC {
    name: string;
    life_weeks: number;
    type: string;
}

const life_weeks_ganache = 5;
const life_weeks_praline = 6;
export const ProductList: ProductC[] = [
    // ── GANACHES (durée de vie : 5 semaines) ──────────────────
    { name: "Citron Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Poivre Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Origine République Dominicaine", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Origine Madagascar", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Origine Venezuela", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Coco Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Thé Earl Grey", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Passion Lait", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Palet Or Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Palet Moka Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Mokamande Noir", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Palet Or Lait", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Palet Guérande", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Mokamande Lait", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Caramel", life_weeks: life_weeks_ganache, type: "ganache" },
    { name: "Palet Mère de Famille", life_weeks: life_weeks_ganache, type: "ganache" },

    // ── PRALINÉS (durée de vie : 6 semaines) ──────────────────
    { name: "Pavé de Tours Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Pavé de Tours Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Café Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Café Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Amande Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Amande Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné À l'Ancienne Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné À l'Ancienne Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Noisette Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Noisette Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Pistache Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Pistache Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Sésame Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Sésame Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Rocher Praliné Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Rocher Praliné Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Chiaracrousti Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Chiaracrousti Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Amanda", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Palet du Faubourg Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Palet du Faubourg Lait", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Amande Noisette Noir", life_weeks: life_weeks_praline, type: "praliné" },
    { name: "Praliné Amande Noisette Lait", life_weeks: life_weeks_praline, type: "praliné" },

    // ── PÂTES D'AMANDES ───────────────────────────────────────
    { name: "Pâte d'Amandes Pistache Noir", life_weeks: life_weeks_praline, type: "pâte d'amandes" },
    { name: "Pâte d'Amandes Pistache Lait", life_weeks: life_weeks_praline, type: "pâte d'amandes" },
    { name: "Pâte d'Amandes Noix", life_weeks: life_weeks_praline, type: "pâte d'amandes" },
];
