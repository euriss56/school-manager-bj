import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Basique",
    price: "50 000",
    period: "FCFA/an",
    description: "Pour les petits établissements",
    features: [
      "Jusqu'à 200 élèves",
      "Gestion des inscriptions",
      "Saisie des notes",
      "Génération de bulletins",
      "1 administrateur",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "120 000",
    period: "FCFA/an",
    description: "Pour les établissements en croissance",
    features: [
      "Jusqu'à 500 élèves",
      "Tout le plan Basique",
      "Gestion des paiements",
      "Emplois du temps",
      "Messagerie interne",
      "3 administrateurs",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: "250 000",
    period: "FCFA/an",
    description: "Pour les grands établissements",
    features: [
      "Élèves illimités",
      "Tout le plan Pro",
      "Statistiques avancées",
      "Support prioritaire",
      "Personnalisation",
      "Administrateurs illimités",
    ],
    popular: false,
  },
];

export default function PricingSection() {
  const navigate = useNavigate();
  return (
    <section id="tarifs" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Des tarifs adaptés à votre établissement
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond à la taille de votre école. Tous les plans incluent les mises à jour gratuites.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 border ${
                plan.popular
                  ? "border-secondary shadow-lg shadow-secondary/10 relative"
                  : "border-border"
              } bg-card`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-xs font-bold px-4 py-1 rounded-full">
                  Populaire
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground font-sans">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>
              <div className="mt-6 mb-6">
                <span className="text-4xl font-bold text-foreground font-sans">{plan.price}</span>
                <span className="text-muted-foreground ml-2">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                size="lg"
                onClick={() => navigate("/inscription-ecole")}
              >
                Choisir {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
