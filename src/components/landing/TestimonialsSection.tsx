const testimonials = [
  {
    name: "Mme Adjovi Kossou",
    role: "Directrice, Complexe Scolaire Les Étoiles — Cotonou",
    content:
      "SchoolManager a transformé la gestion de notre école. Les bulletins sont générés en quelques clics et les parents reçoivent tout par email. Un gain de temps incroyable !",
  },
  {
    name: "M. Gbètoho Ahouansou",
    role: "Fondateur, Collège Renaissance — Porto-Novo",
    content:
      "Le suivi des paiements était un cauchemar avant SchoolManager. Maintenant, je sais exactement qui a payé et combien il reste à recouvrer. L'outil est indispensable.",
  },
  {
    name: "Dr. Sèna Houngbédji",
    role: "Recteur, Université Privée du Golfe — Abomey-Calavi",
    content:
      "Même pour une université de 2000 étudiants, SchoolManager gère parfaitement les inscriptions, les notes et la communication. Le support est réactif et professionnel.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-muted-foreground">
            Des directeurs d'écoles béninoises partagent leur expérience.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <p className="text-foreground italic mb-6">"{t.content}"</p>
              <div>
                <p className="font-semibold text-foreground font-sans">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
