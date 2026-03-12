import { GraduationCap, CreditCard, FileText, Calendar, MessageSquare, BarChart3 } from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Inscriptions",
    description: "Gérez les inscriptions des élèves avec suivi complet : dossiers, matricules, validation automatique.",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    description: "Suivez les frais scolaires, générez des reçus, et visualisez le taux de recouvrement en temps réel.",
  },
  {
    icon: FileText,
    title: "Bulletins",
    description: "Saisie des notes, calcul automatique des moyennes, génération et envoi de bulletins PDF professionnels.",
  },
  {
    icon: Calendar,
    title: "Emplois du temps",
    description: "Créez et gérez les emplois du temps avec détection automatique des conflits.",
  },
  {
    icon: MessageSquare,
    title: "Communication",
    description: "Messagerie interne entre administration, enseignants et parents. Annonces et notifications.",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    description: "Tableaux de bord analytiques : taux de réussite, absences, finances et évolution des effectifs.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tout ce dont votre école a besoin
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une plateforme complète pour gérer efficacement tous les aspects de votre établissement scolaire.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-lg p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 font-sans">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
