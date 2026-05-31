interface Chocolate {
    name: string;
    life_weeks: number;
}

const life_weeks_ganache = 5;
const life_weeks_praline = 6;
export const chocolateList: Chocolate[] = [
    // ── GANACHES (durée de vie : 5 semaines) ──────────────────
    { name: "Citron Noir", life_weeks: life_weeks_ganache },
    { name: "Poivre Noir", life_weeks: life_weeks_ganache },
    { name: "Origine République Dominicaine", life_weeks: life_weeks_ganache },
    { name: "Origine Madagascar", life_weeks: life_weeks_ganache },
    { name: "Origine Venezuela", life_weeks: life_weeks_ganache },
    { name: "Coco Noir", life_weeks: life_weeks_ganache },
    { name: "Thé Earl Grey", life_weeks: life_weeks_ganache },
    { name: "Passion Lait", life_weeks: life_weeks_ganache },
    { name: "Palet Or Noir", life_weeks: life_weeks_ganache },
    { name: "Palet Moka Noir", life_weeks: life_weeks_ganache },
    { name: "Mokamande Noir", life_weeks: life_weeks_ganache },
    { name: "Palet Or Lait", life_weeks: life_weeks_ganache },
    { name: "Palet Guérande", life_weeks: life_weeks_ganache },
    { name: "Mokamande Lait", life_weeks: life_weeks_ganache },
    { name: "Caramel", life_weeks: life_weeks_ganache },
    { name: "Palet Mère de Famille", life_weeks: life_weeks_ganache },

    // ── PRALINÉS (durée de vie : 6 semaines) ──────────────────
    { name: "Pavé de Tours Noir", life_weeks: life_weeks_praline },
    { name: "Pavé de Tours Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Café Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Café Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Amande Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Amande Lait", life_weeks: life_weeks_praline },
    { name: "Praliné À l'Ancienne Noir", life_weeks: life_weeks_praline },
    { name: "Praliné À l'Ancienne Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Noisette Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Noisette Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Pistache Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Pistache Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Sésame Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Sésame Lait", life_weeks: life_weeks_praline },
    { name: "Rocher Praliné Noir", life_weeks: life_weeks_praline },
    { name: "Rocher Praliné Lait", life_weeks: life_weeks_praline },
    { name: "Chiaracrousti Noir", life_weeks: life_weeks_praline },
    { name: "Chiaracrousti Lait", life_weeks: life_weeks_praline },
    { name: "Amanda", life_weeks: life_weeks_praline },
    { name: "Palet du Faubourg Noir", life_weeks: life_weeks_praline },
    { name: "Palet du Faubourg Lait", life_weeks: life_weeks_praline },
    { name: "Praliné Amande Noisette Noir", life_weeks: life_weeks_praline },
    { name: "Praliné Amande Noisette Lait", life_weeks: life_weeks_praline },

    // ── PÂTES D'AMANDES ───────────────────────────────────────
    { name: "Pâte d'Amandes Pistache Noir", life_weeks: life_weeks_praline },
    { name: "Pâte d'Amandes Pistache Lait", life_weeks: life_weeks_praline },
    { name: "Pâte d'Amandes Noix", life_weeks: life_weeks_praline },
];
