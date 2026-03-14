import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RecuData {
  recu_numero: string;
  date_paiement: string;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe: string;
  frais_nom: string;
  montant_paye: number;
  mode_paiement: string;
  school_nom: string;
  school_ville: string;
  enregistre_par: string;
}

export function generateRecu(data: RecuData) {
  const doc = new jsPDF();

  // En-tête
  doc.setFillColor(15, 82, 74);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.school_nom, 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.school_ville + " — Bénin", 105, 23, { align: "center" });
  doc.text("REÇU DE PAIEMENT", 105, 31, { align: "center" });

  // Numéro reçu
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`N° ${data.recu_numero}`, 15, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date : ${new Date(data.date_paiement).toLocaleDateString("fr-FR")}`, 150, 50);

  // Infos élève
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DE L'ÉLÈVE", 15, 65);
  doc.setDrawColor(15, 82, 74);
  doc.line(15, 67, 195, 67);

  autoTable(doc, {
    startY: 70,
    head: [],
    body: [
      ["Nom & Prénom", `${data.eleve_prenom} ${data.eleve_nom}`],
      ["Matricule", data.matricule],
      ["Classe", data.classe],
    ],
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
  });

  // Détails paiement
  const afterEleve = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DÉTAILS DU PAIEMENT", 15, afterEleve);
  doc.line(15, afterEleve + 2, 195, afterEleve + 2);

  autoTable(doc, {
    startY: afterEleve + 5,
    head: [["Type de frais", "Montant payé", "Mode de paiement"]],
    body: [[
      data.frais_nom,
      `${data.montant_paye.toLocaleString("fr-FR")} FCFA`,
      data.mode_paiement,
    ]],
    theme: "striped",
    headStyles: { fillColor: [15, 82, 74], textColor: 255 },
    styles: { fontSize: 10 },
  });

  // Total
  const afterPaiement = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(120, afterPaiement - 5, 75, 15, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL : ${data.montant_paye.toLocaleString("fr-FR")} FCFA`, 160, afterPaiement + 5, { align: "center" });

  // Signature
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Enregistré par : ${data.enregistre_par}`, 15, afterPaiement + 20);
  doc.text("Signature & Cachet", 150, afterPaiement + 20);
  doc.rect(140, afterPaiement + 22, 50, 20);

  // Pied de page
  doc.setFillColor(15, 82, 74);
  doc.rect(0, 285, 210, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Ce reçu est un document officiel — SchoolManager BJ", 105, 292, { align: "center" });

  doc.save(`recu-${data.recu_numero}.pdf`);
}
