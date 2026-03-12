import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Comment fonctionne l'inscription de mon école ?",
    answer:
      "Remplissez le formulaire d'inscription avec les informations de votre établissement. Après validation par notre équipe (sous 24h), vous recevez vos identifiants par email et pouvez commencer à utiliser SchoolManager immédiatement.",
  },
  {
    question: "Puis-je changer de plan en cours d'année ?",
    answer:
      "Oui, vous pouvez passer à un plan supérieur à tout moment. La différence de prix est calculée au prorata. Le passage à un plan inférieur prend effet au renouvellement.",
  },
  {
    question: "Les données de mon école sont-elles sécurisées ?",
    answer:
      "Absolument. Chaque école dispose d'un espace totalement isolé. Les données sont chiffrées et hébergées sur des serveurs sécurisés. Aucune école ne peut accéder aux données d'une autre.",
  },
  {
    question: "Les parents peuvent-ils consulter les bulletins en ligne ?",
    answer:
      "Oui, chaque parent dispose d'un espace personnel où il peut consulter les bulletins, suivre les paiements, voir l'emploi du temps et communiquer avec les enseignants.",
  },
  {
    question: "SchoolManager fonctionne-t-il sur téléphone ?",
    answer:
      "Oui, l'application est entièrement responsive et fonctionne sur smartphone, tablette et ordinateur. Aucune application à installer.",
  },
  {
    question: "Proposez-vous un accompagnement à la prise en main ?",
    answer:
      "Oui, les plans Pro et Premium incluent une formation en ligne pour l'administration et les enseignants. Le plan Premium inclut un support prioritaire par téléphone.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Questions fréquentes
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-sans font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
