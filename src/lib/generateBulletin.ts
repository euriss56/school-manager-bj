import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BulletinData {
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe: string;
  periode: string;
  annee_scolaire: string;
  rang: number;
  total_eleves: number;
  moyenne_generale: number;
  mention: string;
  school_nom: string;
  school_ville: string;
  matieres: {
    nom: string;
    coefficient: number;
    note_ds1: number | null;
    note_ds2: number | null;
    note_compo: number | null;
    moyenne: number | null;
    appreciation: string | null;
  }[];
}

export function generateBulletin(data: BulletinData) {
  const doc = new jsPDF();

  // En-tête école
  doc.setFillColor(15, 82, 74);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.school_nom, 105, 14, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(data.school_ville + " — Bénin", 105, 22, { align: "center" });
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("BULLETIN DE NOTES", 105, 33, { align: "center" });

  // Infos élève
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 248, 245);
  doc.rect(10, 45, 190, 30, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.eleve_prenom} ${data.eleve_nom}`, 15, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Matricule : ${data.matricule}`, 15, 63);
  doc.text(`Classe : ${data.classe}`, 80, 63);
  doc.text(`Période : ${data.periode}`, 145, 63);
  doc.text(`Année : ${data.annee_scolaire}`, 15, 70);

  // Tableau des notes
  autoTable(doc, {
    startY: 82,
    head: [["Matière", "Coeff.", "DS1", "DS2", "Compo", "Moyenne", "Appréciation"]],
    body: data.matieres.map(m => [
      m.nom,
      m.coefficient,
      m.note_ds1 !== null ? m.note_ds1.toFixed(2) : "—",
      m.note_ds2 !== null ? m.note_ds2.toFixed(2) : "—",
      m.note_compo !== null ? m.note_compo.toFixed(2) : "—",
      m.moyenne !== null ? m.moyenne.toFixed(2) : "—",
      m.appreciation || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 82, 74], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
      6: { cellWidth: 40 },
    },
  });

  // Résumé
  const afterTable = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(15, 82, 74);
  doc.rect(10, afterTable, 190, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Moyenne générale : ${data.moyenne_generale.toFixed(2)}/20`, 15, afterTable + 10);
  doc.text(`Rang : ${data.rang}e / ${data.total_eleves}`, 85, afterTable + 10);
  doc.text(`Mention : ${data.mention}`, 150, afterTable + 10);

  // Appréciations
  const afterSummary = afterTable + 35;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Appréciation du directeur :", 15, afterSummary);
  doc.setDrawColor(15, 82, 74);
  doc.rect(10, afterSummary + 5, 190, 20);

  // Signatures
  const afterAppreciation = afterSummary + 35;
  doc.setFont("helvetica", "normal");
  doc.text("Signature Directeur", 30, afterAppreciation + 15, { align: "center" });
  doc.rect(15, afterAppreciation, 50, 20);
  doc.text("Signature Parent", 105, afterAppreciation + 15, { align: "center" });
  doc.rect(80, afterAppreciation, 50, 20);
  doc.text("Cachet École", 175, afterAppreciation + 15, { align: "center" });
  doc.rect(150, afterAppreciation, 50, 20);

  // Pied de page
  doc.setFillColor(15, 82, 74);
  doc.rect(0, 285, 210, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("Document officiel — SchoolManager BJ", 105, 292, { align: "center" });

  doc.save(`bulletin-${data.eleve_nom}-${data.periode}.pdf`);
}
